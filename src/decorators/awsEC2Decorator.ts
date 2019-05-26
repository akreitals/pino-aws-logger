import axios from 'axios';
import AWS from 'aws-sdk';
import { LogDecorator } from './logDecoratorInterface';

export interface AwsEc2Decorator extends LogDecorator {
  getMetadata: () => Promise<AwsEc2Metadata>;
}

export interface AwsEc2Metadata {
  amiId: string;
  availabilityZone: string;
  instanceId: string;
  instanceType: string;
  privateIp: string;
}

const isEnabled = async (): Promise<boolean> => {
  try {
    // Identification of EC2 instance
    // See https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/identify_ec2_instances.html
    const response = await axios.head(
      'http://169.254.169.254/latest/dynamic/instance-identity/',
      { timeout: 250 }
    );

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    return false;
  }
};

const metadataKey = 'ec2';

const metadataService = new AWS.MetadataService();

const fetchMetadata = async (path: string): Promise<string> => {
  return new Promise(resolve => {
    metadataService.request(path, (error, response) => {
      if (error) {
        resolve(undefined);
      }

      resolve(response);
    });
  });
};

const getMetadata = async (): Promise<any> => {
  return Promise.all([
    fetchMetadata('/latest/meta-data/ami-id'),
    fetchMetadata('/latest/meta-data/instance-id'),
    fetchMetadata('/latest/meta-data/instance-type'),
    fetchMetadata('/latest/meta-data/local-hostname'),
    fetchMetadata('/latest/meta-data/placement/availability-zone'),
  ])
    .then(([amiId, instanceId, instanceType, privateIp, availabilityZone]) => {
      return {
        amiId,
        instanceId,
        instanceType,
        privateIp,
        availabilityZone,
      };
    })
    .catch(() => {
      return undefined;
    });
};

const decorator: AwsEc2Decorator = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default decorator;
