# pino-aws-logger
Extendable NodeJS JSON logger with built in decorators for for AWS Lambda and EC2 environments. Built for AWS applications, particularly those whose logs are aggregated in Splunk.

Note that in Lambda environments this will make `process.stdout.write` a blocking function due to AWS Lambda's asynchronous behaviour.

Inspired by the Financial Times [lamdba logger](https://github.com/Financial-Times/lambda-logger).

## API
The logger's API is identical to that of pino with the following exceptions:

## Configuration