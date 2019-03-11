import pino, { Logger } from 'pino';
import lambdaEnhancer from './enhancers/aws-lambda-enchancer';
import appEnhancer from './enhancers/node-app-enhancer';
import ec2Enhancer from './enhancers/aws-ec2-enchancer';
import { Enhancer } from './enhancers/interface';

interface LogMetadata {
  sourceType: string;
  environment?: string;
  [key: string]: string | object | undefined;
}

const enhancers: Enhancer[] = [ec2Enhancer, lambdaEnhancer, appEnhancer];

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

const getMetadata = (): LogMetadata => {
  const baseMetadata = {
    sourceType: '_json',
    environment: process.env.NODE_ENV || process.env.STAGE,
  };
  const metadata = enhancers.reduce(
    (result, enhancer) =>
      enhancer.isEnabled()
        ? { ...result, [enhancer.metadataKey]: enhancer.getMetadata() }
        : {},
    {}
  );
  return { ...baseMetadata, ...metadata };
};

export const createLogger = (): Logger => {
  const logger: Logger = getBaseLogger();
  const metadata: LogMetadata = getMetadata();
  const definedMetadata = filterUndefinedValues(metadata);

  return logger.child(definedMetadata);
};
