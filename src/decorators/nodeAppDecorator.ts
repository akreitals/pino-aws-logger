import { LogDecorator } from './logDecoratorInterface';

export interface NodeAppDecorator extends LogDecorator {
  getMetadata: () => NodeAppMetadata;
}

interface NodeAppMetadata {
  name: string;
  version: string;
}

interface PackageJSON {
  name: string;
  version: string;
  [key: string]: any;
}

function loadMainPackageJSON(attempts: number = 1): PackageJSON {
  if (attempts > 5) {
    throw new Error("Can't resolve main package.json file");
  }

  const mainPath = attempts === 1 ? './' : Array(attempts).join('../');
  try {
    // @ts-ignore
    return require.main.require(mainPath + 'package.json');
  } catch (e) {
    return loadMainPackageJSON(attempts + 1);
  }
}

const isEnabled = (): Promise<boolean> => {
  try {
    loadMainPackageJSON();
    return Promise.resolve(true);
  } catch (error) {
    return Promise.resolve(false);
  }
};

const metadataKey = 'app';

const getMetadata = (): NodeAppMetadata => {
  const { name, version } = loadMainPackageJSON();

  return {
    name,
    version,
  };
};

const decorator: NodeAppDecorator = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default decorator;
