import { createLogger, PinoAwsLoggerOptions } from './logger';
import { Logger } from 'pino';
import { LogDecorator } from './decorators/logDecoratorInterface';
import { setupEnv } from '../test/environmentHelper';

import lambdaDecorator from './decorators/awsLambdaDecorator';
import appDecorator from './decorators/nodeAppDecorator';
import ec2Decorator from './decorators/awsEC2Decorator';

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

  describe('Config options', () => {
    it('should override default option with options provided to logger', async () => {
      const options: PinoAwsLoggerOptions = {
        base: { pid: process.pid },
      };
      logger = await createLogger(options);

      logger.info('message');

      const callJson: object = getLogObject();
      expect(callJson).toHaveProperty('pid');
    });

    it('should allow pino options to be provided to the logger', async () => {
      const options: PinoAwsLoggerOptions = {
        customLevels: {
          foo: 35,
        },
      };
      logger = await createLogger(options);

      logger.foo('message');

      const callJson: object = getLogObject();
      expect(callJson).toHaveProperty('level', 'foo');
    });
  });

  describe('Log decorators', () => {
    xit('should check the availability of the default log decorators', async () => {
      ec2Decorator.isEnabled = jest.fn().mockRejectedValue(false);
      lambdaDecorator.isEnabled = jest.fn().mockRejectedValue(false);
      appDecorator.isEnabled = jest.fn().mockRejectedValue(true);

      logger = await createLogger();
      logger.info('1');
      logger.info('2');
      logger.info('3');

      expect(ec2Decorator.isEnabled).toBeCalledTimes(1);
      expect(lambdaDecorator.isEnabled).toBeCalledTimes(1);
      expect(appDecorator.isEnabled).toBeCalledTimes(1);

      jest.restoreAllMocks();
    });

    xit('should only request the log decorator metadata once', async () => {
      ec2Decorator.isEnabled = jest.fn().mockRejectedValue(true);
      lambdaDecorator.isEnabled = jest.fn().mockRejectedValue(true);
      appDecorator.isEnabled = jest.fn().mockRejectedValue(true);
      ec2Decorator.getMetadata = jest
        .fn()
        .mockRejectedValue({ metadata: 'data' });
      lambdaDecorator.getMetadata = jest
        .fn()
        .mockRejectedValue({ metadata: 'data' });
      appDecorator.getMetadata = jest
        .fn()
        .mockRejectedValue({ metadata: 'data' });

      logger = await createLogger();
      logger.info('1');
      logger.info('2');
      logger.info('3');

      expect(ec2Decorator.getMetadata).toBeCalledTimes(1);
      expect(lambdaDecorator.getMetadata).toBeCalledTimes(1);
      expect(appDecorator.getMetadata).toBeCalledTimes(1);

      jest.restoreAllMocks();
    });

    it('should allow custom decorators to be added to the logger instance', async () => {
      const testMetadata = { metadata1: 'one', metadata2: 2 };
      const testDecorator: LogDecorator = {
        isEnabled: async () => true,
        metadataKey: 'test-decorator',
        getMetadata: async () => testMetadata,
      };
      const options: PinoAwsLoggerOptions = {
        decorators: [testDecorator],
      };
      logger = await createLogger(options);

      logger.info('message');

      const callJson: object = getLogObject();
      expect(callJson).toHaveProperty('test-decorator', testMetadata);
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
