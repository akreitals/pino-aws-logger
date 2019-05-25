import { LogDecorator } from './logDecoratorInterface';
import { name, version } from '../../package.json';

export interface NodeAppDecorator extends LogDecorator {
  getMetadata: () => NodeAppMetadata;
}

interface NodeAppMetadata {
  name: string;
  version: string;
}

const isEnabled = (): Promise<boolean> => Promise.resolve(true);

const metadataKey = 'app';

const getMetadata = (): NodeAppMetadata => ({
  name,
  version,
});

const decorator: NodeAppDecorator = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default decorator;
