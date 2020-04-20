# serverless-plugin-cloudwatch
Serverless plugin for setting up AWS CloudWatch dashboards with widgets (only from type 'metric') for configured metrics.

v0.1.10: it's still in development, not ready to use right now :) 

## Installation
Install via npm in the root of your Serverless service:

    npm install serverless-plugin-cloudwatch

Add the plugin to the  `plugins`  array of your Serverless service in  `serverless.yml`:

    plugins:
      - serverless-plugin-cloudwatch

## Usage
There will be only one dashboard per deployment stage. 
A dashboard is a customizable home page in the CloudWatch console that you can use to monitor your AWS resources in a *single view*. 
That's why there will be only one dashboard per deployment.

Following AWS Services are currently supported: 

- AWS Lambda
- AWS DynamoDB

(AWS S3 and AWS ApiGateway follows soon) 

### Configuration of the dashboard
The plugin can be configured by adding a property called `dashboard` to the custom properties of the Serverless service.
#### Lambda
This is the minimum required configuration:

```yaml
dashboard:
  lambda:
    enabled: true
```

Default configuration
It will be used, if you only include the minimum required configuration.
The default configuration looks like this:

```yaml
dashboard:
  lambda:
    widgets:
      - name: 'sum of function invocations'
        metrics: 
          - name: 'Invocations'
            stat: 'Sum'
      - name: 'number of invocations that result in a function error',
        metrics: 
          - name: 'Erorrs'
            stat: 'Sum'
    enabled: true
```

With the default configuration the following widgets will be added to the cloudwatch dashboard:
- one widget with the title 'Sum of Invocations' and one metric 'Invocations'. 
- one widget with the title 'Sum of Errors' and one metric 'Errors'
The metrics in a widget will be shown for each of your lambda functions (if lambda dashboards are enabled globally).

##### You can configure by your own:
- the number of widgets by adding a widget to the array
- the title (`name`) of the widget
- which metrics (`name`) should be included in each widget
- which statistic (`stat`) should be used for each metric


To gain maximum control over which functions to be included, you can disable lambda dashboards globally,
```yaml
dashboard:
  lambda:
    enabled: false
```
and enable it only for specific functions, by setting the dashboard flag for those functions to true:
```yaml
functions:
    myFunction:
      handler: some_handler
      dashboard: true
```
#### DynamoDB 
This is the minimum required configuration:

```yaml
dashboard:
  dynamoDB:
    enabled: true
```

Default configuration
It will be used, if you only include the minimum required configuration.
The default configuration looks like this:

```yaml
dashboard:
  dynamoDB:
    widgets:
      - name: 'sum of system- and user errors'
        metrics: 
          - name: 'SystemErrors'
            stat: 'Sum'
            dimension: 'TableName'
          - name: 'UserErrors'
            stat: 'Sum'
            dimension: 'TableName'
      - name: 'average time of successful requests',
        metrics: 
          - name: 'SuccessfulRequestLatency'
            stat: 'Average'
            dimension: 'TableName'
    enabled: true
```
With the default configuration the following widgets will be added to the cloudwatch dashboard:
- one widget with the title 'System- and UserErrors' and two metrics 'SystemErrors' and 'UserErrors'. 
- one widget with the title 'Successful requests' and one metric 'SuccessfulRequestLatency'

The metrics in those widget will be shown for each of your dynamoDB tables.

##### You can configure by your own:
- the number of widgets by adding a widget to the array
- the title (`name`) of the widget
- which metrics (`name`) should be included in each widget
- which statistic (`stat`) should be used for each metric
- which dimension (`dimension`) should be used for each metric (`GlobalSecondaryIndexName` | `Operation` | `ReceivingRegion` | `StreamLabel` | `TableName`).
 See [AWS DynamoDB Metrics and Dimensions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html)

#### S3 
This is the minimum required configuration:

```yaml
dashboard:
  s3:
    enabled: true
```

Default configuration
It will be used, if you only include the minimum required configuration.
The default configuration looks like this:

```yaml
dashboard:
  s3:
    widgets:
      - name: 'daily storage metrics for buckets'
        metrics: 
          - name: 'BucketSizeBytes'
            stat: 'Average'
            dimension: 'BucketName'
          - name: 'UserErrors'
            stat: 'Average'
            dimension: 'BucketName'
      - name: 'total request latency',
        metrics: 
          - name: 'TotalRequestLatency'
            stat: 'Average'
            dimension: 'BucketName'
    enabled: true
```
#### ApiGateway 
This is the minimum required configuration:

```yaml
dashboard:
  apiGateway:
    enabled: true
```

Default configuration
It will be used, if you only include the minimum required configuration.
The default configuration looks like this:

```yaml
dashboard:
  apiGateway:
    widgets:
      - name: 'system- and user errors'
        metrics: 
          - name: '5xxErrors'
            stat: 'Sum'
          - name: '4xxErrors'
            stat: 'Sum'
      - name: 'total number of API requests',
        metrics: 
          - name: 'Count'
            stat: 'SampleCount'
    enabled: true
```
## License

This software is released under the MIT license. See  [the license file](https://github.com/anna-b96/serverless-plugin-cloudwatch/blob/master/LICENSE)  for more details.

