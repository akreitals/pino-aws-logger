export interface Enhancer {
  isEnabled: () => boolean;
  metadataKey: string;
  getMetadata: () => object;
}
