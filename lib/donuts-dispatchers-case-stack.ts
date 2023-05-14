import { Stack, StackProps, Duration } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import * as path from 'path';
import * as cdk from "aws-cdk-lib";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";


export class DonutsDispatchersCaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define the DynamoDB Table
    const ordersTable = new dynamodb.Table(this, "Orders", {
      partitionKey: { name: "companyId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    ordersTable.addGlobalSecondaryIndex({
      indexName: 'DeliveryDateIndex',
      partitionKey: { name: 'deliveryDate', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Define the SQS Queue
    const ordersQueue = new sqs.Queue(this, "OrdersQueue", {
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: Duration.seconds(300),
    });

    // functions
    // Define the Lambda function to process API Gateway orders requests
    const ordersApiHandler = new NodejsFunction(this, "OrdersApiHandler", {
      entry: path.join(__dirname, `/../functions/ordersApiHandler.ts`),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      },
    });

    // Define the Lambda function to create SQS messages
    const ordersQueueHandler = new NodejsFunction(this, "OrdersQueueHandler", {
      entry: path.join(__dirname, `/../functions/ordersQueueHandler.ts`),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
        ORDERS_QUEUE_URL: ordersQueue.queueUrl,
      },
    });

    // Define the Lambda function to process SQS messages
    const processOrdersHandler = new NodejsFunction(this, "ProcessOrdersHandler", {
      entry: path.join(__dirname, `/../functions/processOrdersHandler.ts`),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        ORDERS_QUEUE_URL: ordersQueue.queueUrl,
      },
    });
    // add the SQS queue as an event source for  the processOrdersHandler lambda function
    processOrdersHandler.addEventSource(new lambdaEventSources.SqsEventSource(ordersQueue));

    // Define the API Gateway
    const api = new apigateway.RestApi(this, "OrdersApi", {
      restApiName: "Orders Service",
      description: "Handles incoming orders requests.",
    });

    // Define the resource and method for API Gateway
    const orders = api.root.addResource("orders");
    orders.addMethod("POST", new apigateway.LambdaIntegration(ordersApiHandler));

    // Grant permissions
    ordersTable.grantWriteData(ordersApiHandler);
    ordersTable.grantReadWriteData(ordersQueueHandler);
    ordersQueue.grantSendMessages(ordersQueueHandler);
    ordersQueue.grantConsumeMessages(processOrdersHandler);

    // Define the EventBridge Rule to trigger the Lambda function every day at 1AM
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.cron({ minute: "0", hour: "1" }),
    });

    // Add the Lambda function as a target of the EventBridge Rule
    rule.addTarget(new targets.LambdaFunction(ordersQueueHandler));

    // to allow manual invokation of this rule from cli
    const ruleManual = new events.Rule(this, 'RuleManual', {
      eventPattern: {
        source: ['com.donuts.dl'],
        detailType: ['ManualTrigger'],
      },
    });

    ruleManual.addTarget(new targets.LambdaFunction(ordersQueueHandler));

    // Finally, output the API Gateway URL in the CloudFormation Outputs
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url ?? "Something went wrong with the deploy",
    });

  }
}
