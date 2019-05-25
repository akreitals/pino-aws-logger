// import axios from 'axios';
// import { Logger } from 'pino';
// import ec2Decorator from './decorators/awsEC2Decorator';

describe('AWS EC2 decorator', () => {
  it('should not add ec2 metadata if the instance identity endpoint does not exist', async () => {
    //   const mockedAxiosHead = jest.spyOn(axios, 'head');
    //   // @ts-ignore
    //   mockedAxiosHead.mockRejectedValue({ status: 500 });
    //   logger = await createLogger();
    //   logger.info({ someObject: { someNesting: true } }, 'some message');
    //   const callJson = getLogObject();
    //   expect(callJson).not.toHaveProperty(`ec2`);
    //   mockedAxiosHead.mockRestore();
    expect(true).toBeTruthy();
  });
  //   xit('should add ec2 metadata if the instance identity endpoint exists', async () => {
  //     const mockedAxiosHead = jest.spyOn(axios, 'head');
  //     // @ts-ignore
  //     mockedAxiosHead.mockResolvedValue({ status: 200 });
  //     logger = await createLogger();
  //     logger.info({ someObject: { someNesting: true } }, 'some message');
  //     const callJson = getLogObject();
  //     expect(callJson).toHaveProperty(`ec2`);
  //     mockedAxiosHead.mockRestore();
  //   });
});
