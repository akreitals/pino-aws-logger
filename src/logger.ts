import pino, { Logger } from 'pino';
import lambdaDecorator from './decorators/aws-lambda-decorator';
import appDecorator from './decorators/node-app-decorator';
import ec2Decorator from './decorators/aws-ec2-decorator';
import { LogDecorator } from './decorators/log-decorator';

interface LogMetadata {
  sourceType: string;
  environment?: string;
  [key: string]: string | object | undefined;
}

const decorators: LogDecorator[] = [
  appDecorator,
  lambdaDecorator,
  ec2Decorator,
];

const filterUndefinedValues = (data: any) =>
  Object.keys(data)
    .filter(key => typeof data[key] !== 'undefined')
    .reduce((result, key) => ({ ...result, [key]: data[key] }), {});

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

const getMetadata = async (): Promise<LogMetadata> => {
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

export const createLogger = (): Promise<Logger> => {
  const logger: Logger = getBaseLogger();

  return getMetadata()
    .then(metadata => {
      const definedMetadata = filterUndefinedValues(metadata);
      return logger.child(definedMetadata);
    })
    .catch(e => {
      // tslint:disable-next-line:no-console
      console.log('it fucked: ', e);
      return logger;
    });
};
