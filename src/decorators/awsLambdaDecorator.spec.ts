import { setupEnv } from '../../test/environmentHelper';
import decorator from './awsLambdaDecorator';

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

  it('should be enabled when a task root and execution enviroment variables are available', () => {
    return expect(decorator.isEnabled()).resolves.toBeTruthy();
  });

  it('should not be enabled when a task root and execution enviroment variables are not available', () => {
    restoreTaskRoot();
    restoreExecutionEnv();

    return expect(decorator.isEnabled()).resolves.toBeFalsy();
  });

  it('should return an appropriate metadata key', () => {
    expect(decorator.metadataKey).toBe('lambda');
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
    it(`should add the property '${property}' to the metadata when the AWS environment variable '${envKey}' is set`, async () => {
      const restore: () => void = setupEnv(envKey, value);

      try {
        const metadata = await decorator.getMetadata();
        expect(metadata).toHaveProperty(`${property}`, value);
      } finally {
        restore();
      }
    });
  });
});
