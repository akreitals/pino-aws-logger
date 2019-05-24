# pino-aws-logger
Extendable NodeJS JSON logger with built in decorators for for AWS Lambda and EC2 environments. Built for AWS applications, particularly those whose logs are aggregated in Splunk.

Note that in Lambda environments this will make `process.stdout.write` a blocking function due to AWS Lambda's asynchronous behaviour.

Inspired by the Financial Times [lamdba logger](https://github.com/Financial-Times/lambda-logger).

## API
The logger's API is identical to that of pino with the following exceptions:
- The property sourcetype: _json is added to logs in production for Splunk compatibility.
- Defaults to ISO timestamp logging for splunk compatiblity. At the time of writing this incurs a 25% pino performance penalty.
- Additional log decorators can be added to enhance the log output

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