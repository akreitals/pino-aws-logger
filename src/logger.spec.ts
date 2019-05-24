import { createLogger } from './logger';
import { Logger } from 'pino';
import axios from 'axios';

const setupEnv = (envKey: string, value: string | undefined) => {
  const backupEnv = process.env[envKey];

  process.env[envKey] = value;

  return function restore() {
    if (typeof backupEnv !== 'undefined') {
      process.env[envKey] = backupEnv;
    } else {
      delete process.env[envKey];
    }
  };
};

describe('pino aws logger', () => {
  const stdoutSpy: jest.SpyInstance = jest.spyOn(process.stdout, 'write');
  let logger: Logger;

  const getLogObject = (): any => {
    expect(stdoutSpy).toHaveBeenCalled();
    try {
      return JSON.parse(stdoutSpy.mock.calls[0]);
    } catch (e) {
      return {
        errora: e,
        message: stdoutSpy.mock.calls[0],
        two: stdoutSpy.mock.calls[1],
      };
    }
  };

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should log JSON to stdout in the correct format', async () => {
    const expectedLog = {
      level: 'info',
      message: 'some message',
      someObject: { someNesting: true },
      sourceType: '_json',
      v: 1,
    };

    logger = await createLogger();

    logger.info({ someObject: { someNesting: true } }, 'some message');

    const callJson: object = getLogObject();
    expect(callJson).toMatchObject(expectedLog);
  });

  it('should log at log level info when LOG_LEVEL is not set', async () => {
    const restore: () => void = setupEnv('LOG_LEVEL', '');

    logger = await createLogger();

    try {
      logger.debug({ someObject: { someNesting: true } }, 'some message');
      logger.info({ someObject: { someNesting: true } }, 'some message');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it('should log at the provided LOG_LEVEL', async () => {
    const restore: () => void = setupEnv('LOG_LEVEL', 'debug');

    logger = await createLogger();

    try {
      logger.trace({ someObject: { someNesting: true } }, 'some message');
      logger.debug({ someObject: { someNesting: true } }, 'some message');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  describe('Node app decorator', () => {
    [
      {
        property: 'name',
      },
      {
        property: 'version',
      },
    ].forEach(({ property }) => {
      it(`should log the ${property} from the package.json file`, async () => {
        logger = await createLogger();
        logger.info({ someObject: { someNesting: true } }, 'some message');
        const callJson = getLogObject();

        expect(callJson).toHaveProperty(`app.${property}`);
      });
    });
  });

  describe('AWS Lambda decorator', () => {
    let restoreTaskRoot: () => void;
    let restoreExecutionEnv: () => void;

    beforeAll(() => {
      restoreTaskRoot = setupEnv('LAMBDA_TASK_ROOT', 'task-root');
      restoreExecutionEnv = setupEnv('AWS_EXECUTION_ENV', 'aws execution env');
    });

    afterAll(() => {
      restoreTaskRoot();
      restoreExecutionEnv();
    });

    [
      {
        property: 'executionEnv',
        envKey: 'AWS_EXECUTION_ENV',
        value: 'execution environment',
      },
      {
        property: 'functionName',
        envKey: 'AWS_LAMBDA_FUNCTION_NAME',
        value: 'lambda name',
      },
      {
        property: 'functionMemorySize',
        envKey: 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE',
        value: '4MB',
      },
      {
        property: 'functionVersion',
        envKey: 'AWS_LAMBDA_FUNCTION_VERSION',
        value: 'test-env',
      },
      {
        property: 'logStreamName',
        envKey: 'AWS_LAMBDA_LOG_STREAM_NAME',
        value: 'test stream',
      },
    ].forEach(({ property, envKey, value }) => {
      it(`should log the property '${property}' when the AWS environment variable '${envKey}' is set`, async () => {
        const restore: () => void = setupEnv(envKey, value);

        logger = await createLogger();
        logger.info({ someObject: { someNesting: true } }, 'some message');
        const callJson = getLogObject();

        try {
          expect(callJson).toHaveProperty(`lambda.${property}`, value);
        } finally {
          restore();
        }
      });
    });
  });

  describe('AWS EC2 decorator', () => {
    it('should not add ec2 metadata if the instance identity endpoint does not exist', async () => {
      const mockedAxiosHead = jest.spyOn(axios, 'head');

      // @ts-ignore
      mockedAxiosHead.mockRejectedValue({ status: 500 });

      logger = await createLogger();
      logger.info({ someObject: { someNesting: true } }, 'some message');
      const callJson = getLogObject();

      expect(callJson).not.toHaveProperty(`ec2`);

      mockedAxiosHead.mockRestore();
    });

    xit('should add ec2 metadata if the instance identity endpoint exists', async () => {
      const mockedAxiosHead = jest.spyOn(axios, 'head');

      // @ts-ignore
      mockedAxiosHead.mockResolvedValue({ status: 200 });

      logger = await createLogger();
      logger.info({ someObject: { someNesting: true } }, 'some message');
      const callJson = getLogObject();

      expect(callJson).toHaveProperty(`ec2`);

      mockedAxiosHead.mockRestore();
    });
  });

  describe('Error serialiser', () => {
    const someError: Error = new Error('Error message');
    const someMessage: string = 'some message';
    const someAdditionalData: string = 'some data';

    it('should overwrite the error message with the given message', async () => {
      logger = await createLogger();
      logger.info(
        // tslint:disable-next-line:prefer-object-spread
        Object.assign(someError, { additional: someAdditionalData }),
        someMessage
      );

      const callJson: object = getLogObject();
      expect(callJson).toHaveProperty('stack');
      expect(callJson).toHaveProperty('message', someMessage);
      expect(callJson).toHaveProperty('additional', someAdditionalData);
    });

    it('should not serialize the first argument error if it is shallow cloned using Object.assign (no error prototype)', async () => {
      logger = await createLogger();
      logger.info(
        // tslint:disable-next-line:prefer-object-spread
        Object.assign({}, someError, {
          additional: someAdditionalData,
        }),
        someMessage
      );

      const callJson: object = getLogObject();
      expect(callJson).not.toHaveProperty('stack');
      expect(callJson).toHaveProperty('message', someMessage);
      expect(callJson).toHaveProperty('additional', someAdditionalData);
    });

    ['err', 'error'].forEach((key: string) => {
      test(`it serializes an error given as property '${key}' as expected`, async () => {
        logger = await createLogger();

        logger.info(
          {
            // tslint:disable-next-line:prefer-object-spread
            [key]: Object.assign(someError, {
              additional: someAdditionalData,
            }),
          },
          someMessage
        );

        const callJson = getLogObject();
        expect(callJson).toHaveProperty(key);
        expect(callJson[key]).toHaveProperty('stack');
        expect(callJson[key]).toHaveProperty('additional', someAdditionalData);
        expect(callJson).toHaveProperty('message', someMessage);
      });
    });
  });
});
