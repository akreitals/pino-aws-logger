import decorator from './nodeAppDecorator';

describe('Node app decorator', () => {
  it('should always be enabled by default', () => {
    return expect(decorator.isEnabled()).resolves.toBeTruthy();
  });

  it('should return an appropriate metadata key', () => {
    expect(decorator.metadataKey).toBe('app');
  });

  [
    {
      property: 'name',
    },
    {
      property: 'version',
    },
  ].forEach(({ property }) => {
    it(`should log the ${property} from the package.json file`, async () => {
      const metadata = await decorator.getMetadata();

      expect(metadata).toHaveProperty(`${property}`);
    });
  });
});
