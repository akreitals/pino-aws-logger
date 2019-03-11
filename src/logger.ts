import pino, { Logger } from 'pino';

interface AWSLambdaMetadata {
  executionEnv?: string;
  functionName?: string;
  functionMemorySize?: string;
  functionVersion?: string;
  logStreamName?: string;
}

interface LogMetadata {
  sourceType: string;
  environment?: string;
  lambda?: AWSLambdaMetadata;
  [key: string]: string | AWSLambdaMetadata | undefined;
}

const isLambda = () =>
  !!((process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) || false);

const filterUndefinedValues = (data: any) =>
  Object.keys(data)
    .filter(key => typeof data[key] !== 'undefined')
    .reduce((result, key) => ({ ...result, [key]: data[key] }), {});

// enable ISO time stamps rather than epoch time
// note: this results in much slower logging
// https://github.com/pinojs/pino/blob/238fe2857501dca963783d93915506012c8b43bf/docs/legacy.md#v5-4
const getTimeStamp = () => `,"time":"${new Date().toISOString()}"`;

const getBaseLogger = (): Logger => {
  const level = process.env.LOG_LEVEL || 'info';
  const options = {
    base: null,
    level,
    useLevelLabels: true,
    messageKey: 'message',
    timestamp: getTimeStamp,
    serializers: { ...pino.stdSerializers, error: pino.stdSerializers.err },
  };

  return pino(options);
};

const getMetadata = (): LogMetadata => {
  const baseMetadata = {
    sourceType: '_json',
    environment: process.env.NODE_ENV || process.env.STAGE,
  };
  return isLambda()
    ? {
        ...baseMetadata,
        lambda: {
          executionEnv: process.env.AWS_EXECUTION_ENV,
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          functionMemorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
          functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
          logStreamName: process.env.AWS_LAMBDA_LOG_STREAM_NAME,
        },
      }
    : baseMetadata;
};
export const createLogger = (): Logger => {
  const logger: Logger = getBaseLogger();
  const metadata: LogMetadata = getMetadata();
  const definedMetadata = filterUndefinedValues(metadata);

  if (
    isLambda() &&
    // @ts-ignore
    process.stdout._handle &&
    // @ts-ignore
    typeof process.stdout._handle.setBlocking === 'function'
  ) {
    // @ts-ignore
    process.stdout._handle.setBlocking(true);
  }

  return logger.child(definedMetadata);
};
