# serverless-plugin-cloudwatch
Serverless plugin for setting up AWS CloudWatch dashboards with widgets (only from type 'metric') for configured metrics.

v0.1.0: it's still in development, not ready to use right now :) 

## Installation
Install via npm in the root of your Serverless service:

    npm install serverless-plugin-cloudwatch

Add the plugin to the  `plugins`  array of your Serverless service in  `serverless.yml`:

    plugins:
      - serverless-plugin-cloudwatch

## Usage
There will be only one dashboard per deployment stage. 
The real objective is that the dashboard gives only an overview of the current state of your project.
Following AWS Services are currently supported: 

- AWS Lambda

(AWS S3, AWS ApiGateway and AWS DynamoDB follows soon) 

### Configuration of the dashboard
The plugin can be configured by adding a property called `dashboard` to the custom properties of the Serverless service.

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
      - name: 'Sum of Invocations'
        metrics: 
          - name: 'Invocations'
            stat: 'Sum'
      - name: 'Sum of Errors',
        metrics: 
          - name: 'Erorrs'
            stat: 'Sum'
    enabled: true
```

With the default configuration the following widgets will be added to the cloudwatch dashboard:
- one widget with the title 'Sum of Invocations' and one metric 'Invocations'. 
- one widget with the title 'Sum of Errors' and one metric 'Errors'
The metrics in a widget will be shown for each of your lambda functions (if lambda dashboards are enabled globally).

You can configure by your own:
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


## License

This software is released under the MIT license. See  [the license file](https://github.com/anna-b96/serverless-plugin-cloudwatch/blob/master/LICENSE)  for more details.
