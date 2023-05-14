# Welcome to your CDK TypeScript project

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`DonutsDispatchersCaseStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

To delete the app:

`cdk destroy`


API URL is in the cli output after you deploy


Testing manual invoke of eventbridge rule by cli

```agsl
aws events put-events --entries '[{ "Source": "com.donuts.dl", "DetailType": "ManualTrigger", "Detail": "{}", "EventBusName": "default" }]'

```
