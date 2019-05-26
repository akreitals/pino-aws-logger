import axios, { AxiosResponse } from 'axios';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import decorator from './awsEC2Decorator';

describe('AWS Lambda decorator', () => {
  it('should be enabled when an instance identity resource can be located', async () => {
    // tslint:disable-next-line:no-object-literal-type-assertion
    const mockedAxiosHead = jest
      .spyOn(axios, 'head')
      .mockResolvedValue({ status: 200 } as AxiosResponse);
    await expect(decorator.isEnabled()).resolves.toBeTruthy();
    mockedAxiosHead.mockRestore();
  });

  it('should not be enabled when an instance identity resource cannot be located', async () => {
    const mockedAxiosHead = jest
      .spyOn(axios, 'head')
      .mockRejectedValue({ status: 500 });
    await expect(decorator.isEnabled()).resolves.toBeFalsy();
    mockedAxiosHead.mockRestore();
  });

  it('should return an appropriate metadata key', () => {
    expect(decorator.metadataKey).toBe('ec2');
  });

  xit('should add the instance values to the metadata if they could be successfully retrieved', async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock(
      'MetadataService',
      'request',
      // tslint:disable-next-line:ban-types
      (path: string, callback: Function) => {
        callback(null, `${path}-test`);
      }
    );

    const metadata = await decorator.getMetadata();
    expect(metadata).toHaveProperty(
      '/latest/meta-data/ami-id',
      '/latest/meta-data/ami-id-test'
    );
    expect(metadata).toHaveProperty(
      '/latest/meta-data/instance-id',
      '/latest/meta-data/instance-id-test'
    );
    expect(metadata).toHaveProperty(
      '/latest/meta-data/instance-type',
      '/latest/meta-data/instance-type-test'
    );
    expect(metadata).toHaveProperty(
      '/latest/meta-data/local-hostname',
      '/latest/meta-data/local-hostname-test'
    );
    expect(metadata).toHaveProperty(
      '/latest/meta-data/placement/availability-zone',
      '/latest/meta-data/placement/availability-zone-test'
    );
  });
});
