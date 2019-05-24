import pino, { Logger, LoggerOptions } from 'pino';
import lambdaDecorator from './decorators/awsLambdaDecorator';
import appDecorator from './decorators/nodeAppDecorator';
import ec2Decorator from './decorators/awsEC2Decorator';
import { LogDecorator } from './decorators/logDecoratorInterface';

interface LogMetadata {
  sourceType: string;
  environment?: string;
  [key: string]: string | object | undefined;
}

const defaultDecorators: LogDecorator[] = [
  appDecorator,
  lambdaDecorator,
  ec2Decorator,
];

interface PinoAwsLoggerOptions extends LoggerOptions {
  decorators?: LogDecorator[];
}

const filterUndefinedValues = (data: any) =>
  Object.keys(data)
    .filter(key => typeof data[key] !== 'undefined')
    .reduce((result, key) => ({ ...result, [key]: data[key] }), {});

const getTimeStamp = () => `,"time":"${new Date().toISOString()}"`;

const getBaseLogger = (options?: LoggerOptions): Logger => {
  const level = process.env.LOG_LEVEL || 'info';
  const defaults = {
    base: null,
    level,
    useLevelLabels: true,
    messageKey: 'message',
    timestamp: getTimeStamp,
    serializers: { ...pino.stdSerializers, error: pino.stdSerializers.err },
  };

  return pino({ ...options, ...defaults });
};

const getMetadata = async (
  decorators: LogDecorator[]
): Promise<LogMetadata> => {
  const baseMetadata = {
    sourceType: '_json',
    environment: process.env.NODE_ENV || process.env.STAGE,
  };

  let metadata = {};
  for (const decorator of decorators) {
    try {
      if (await decorator.isEnabled()) {
        metadata = {
          ...metadata,
          [decorator.metadataKey]: await decorator.getMetadata(),
        };
      }
    } catch (e) {
      throw new Error(
        `Could not apply '${decorator.metadataKey}' decorator: ${e}`
      );
    }
  }

  return { ...baseMetadata, ...filterUndefinedValues(metadata) };
};

export const createLogger = (
  options: PinoAwsLoggerOptions = {}
): Promise<Logger> => {
  const { decorators = [], ...pinoOptions } = options;
  const logger: Logger = getBaseLogger(pinoOptions);

  return getMetadata([...decorators, ...defaultDecorators])
    .then(metadata => {
      const definedMetadata = filterUndefinedValues(metadata);
      return logger.child(definedMetadata);
    })
    .catch(() => {
      return logger;
    });
};
