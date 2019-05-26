# pino-aws-logger

**WIP!**
---


Extendable NodeJS JSON logger with built in decorators for for AWS Lambda and EC2 environments. Built for AWS applications, particularly those whose logs are aggregated in Splunk.

Note that in Lambda environments this will make `process.stdout.write` a blocking function due to AWS Lambda's asynchronous behaviour.

Inspired by the Financial Times [lamdba logger](https://github.com/Financial-Times/lambda-logger).

## Installation
```
$ npm install aws-pino-logger
```

## Usage
The AWS pino logger is instantiated asynchronously to allow for async configuration in decorators i.e. fetching metadata information from the EC2 instance to enchance the logs. Note that any async decorator configuration is only performed once.

### Node App
```
const awsLogger = require('aws-pino-logger');

(async () => {
    const logger = await awsLogger.createLogger();

    app.listen(8081, () => logger.info('running on port 8081'));
})();
```

Example output:
```
{
    "level": "info",
    "time": "2019-05-26T06:56:04.901Z",
    "sourceType": "_json",
    "app": {
        "name": "node-party",
        "version": "1.3.14"
    },
    "ec2": {
        "amiId": "ami-008ad12124319252a",
        "instanceId": "i-025d2e5049368422",
        "instanceType": "t2.micro",
        "privateIp": "ip-170-12-75-102.us-east-1.compute.internal",
        "availabilityZone": "us-east-3a"
    },
    "message": "running on port 8081",
    "v": 1
}
```
---

### Lambda
```
let logger;

const createLogger = async () => {
  if (logger) {
    return logger;
  }

  logger = await awsLogger.createLogger();
}

module.exports.submit = async (event, context, callback) => {

  await createLogger();

  logger.info('event received');

  callback(null, 'Success');

```

Example output:
```
{
    "level": "info",
    "time": "2019-05-26T07:10:41.913Z",
    "sourceType": "_json",
    "lambda": {
        "executionEnv": "AWS_Lambda_nodejs8.10",
        "functionName": "node-party-invite-service-prod-dispatchBalloon",
        "functionMemorySize": "128",
        "functionVersion": "$LATEST",
        "logStreamName": "2019/05/26/[$LATEST]8362f1ba17344fa0cf0c03g683726a40"
    },
    "message": "event received",
    "v": 1
}
```


## API
The logger's API is identical to that of pino with the following exceptions:
- Defaults the sourcetype to `_json` for Splunk compatibility.
- Defaults to ISO timestamp logging for splunk compatiblity.
- Additional log decorators can be added to enhance the log output.

## Log Decorators
By default the logger includes the following log decorators:
- AWS EC2 decorator - which adds the EC2 instance metadata if the application is running on an EC2 instance
- AWS Lamdba decorator - which adds Lambda related environment details if the application is running on AWS Lambda
- Node App decorator - which adds the Node application name and version as in `package.json`

Addditional decorators can be added any decorated properties are added under the decorator name at the root of the JSON log object. The interface for a log decorator is:
```
interface LogDecorator {
  isEnabled: () => Promise<boolean> | boolean;
  metadataKey: string;
  getMetadata: () => Promise<object> | object;
}
```

## Configuration
- LOG_LEVEL - determines the level to log at. Defaults to `info`