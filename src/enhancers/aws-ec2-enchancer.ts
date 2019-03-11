import { Enhancer } from './interface';

export interface AwsEc2Enhancer extends Enhancer {
  getMetadata: () => AwsEc2Metadata;
}

export interface AwsEc2Metadata {
  ami_id: string;
  availability_zone: string;
  instance_id: string;
  instance_type: string;
  private_ip: string;
  region: string;
}

const isEnabled = (): boolean => true;

const metadataKey = 'app';

const getMetadata = (): AwsEc2Metadata => ({
  ami_id: 'test ami id',
  availability_zone: 'ap-southeast-2c',
  instance_id: 'id',
  instance_type: 'm5.large',
  private_ip: '172.25.167.74',
  region: 'ap-southeast-2',
});

const enhancer: AwsEc2Enhancer = {
  isEnabled,
  metadataKey,
  getMetadata,
};

export default enhancer;
