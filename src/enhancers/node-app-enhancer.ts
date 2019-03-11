import { Enhancer } from './interface';

export interface NodeAppEnhancer extends Enhancer {
  getMetadata: () => NodeAppMetadata;
}

interface NodeAppMetadata {
  name: string;
  version: string;
}

const isEnabled = (): boolean => true;

const metadataKey = 'app';

const getMetadata = (): NodeAppMetadata => ({
  name: 'test-app-name',
  version: '0.1.0',
});

const enhancer: NodeAppEnhancer = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default enhancer;
