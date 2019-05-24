import util from 'util';
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
  } catch (e) {
    return false;
  }
};

const metadataKey = 'ec2';

const metadataService = new AWS.MetadataService();
const readMetaDataAsync = util.promisify(metadataService.request);

const getMetadata = async (): Promise<any> => {
  return Promise.all([
    readMetaDataAsync('ami_id'),
    readMetaDataAsync('instance_id'),
    readMetaDataAsync('instance_type'),
    readMetaDataAsync('private_ip'),
    readMetaDataAsync('availability_zone'),
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
    .catch(() => undefined);
};

const decorator: AwsEc2Decorator = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default decorator;
