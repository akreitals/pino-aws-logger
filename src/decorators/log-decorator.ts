export interface LogDecorator {
  isEnabled: () => Promise<boolean> | boolean;
  metadataKey: string;
  getMetadata: () => Promise<object> | object;
}
