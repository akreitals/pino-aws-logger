import { Enhancer } from './interface';

export interface AwsLambdaEnhancer extends Enhancer {
  getMetadata: () => AwsLambdaMetadata;
}

interface AwsLambdaMetadata {
  executionEnv?: string;
  functionName?: string;
  functionMemorySize?: string;
  functionVersion?: string;
  logStreamName?: string;
}

const isEnabled = (): boolean =>
  !!((process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) || false);

const metadataKey = 'lambda';

const getMetadata = (): AwsLambdaMetadata => ({
  executionEnv: process.env.AWS_EXECUTION_ENV,
  functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
  functionMemorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
  functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
  logStreamName: process.env.AWS_LAMBDA_LOG_STREAM_NAME,
});

(() => {
  if (
    isEnabled() &&
    // @ts-ignore
    process.stdout._handle &&
    // @ts-ignore
    typeof process.stdout._handle.setBlocking === 'function'
  ) {
    // @ts-ignore
    process.stdout._handle.setBlocking(true);
  }
})();

const enhancer: AwsLambdaEnhancer = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default enhancer;
