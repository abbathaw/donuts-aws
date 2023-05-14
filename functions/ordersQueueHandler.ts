import { Handler, Context } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
const tableName = process.env.ORDERS_TABLE_NAME || "Orders";
const queueUrl = process.env.ORDERS_QUEUE_URL;

export const handler: Handler = async (event: any, context: Context) => {
  const today = new Date().toISOString().split('T')[0];
  const params = {
    TableName: tableName,
    IndexName: 'DeliveryDateIndex',
    KeyConditionExpression: 'deliveryDate = :deliveryDate',
    ExpressionAttributeValues: { ':deliveryDate': today },
    ScanIndexForward: true // orders by createdAt in ascending order
  };

  const orders = await dynamo.query(params).promise();

  const items = orders.Items;
  console.log("FOUND items", items)
    if (items){
      for (let order of items) {
        const { orderId, createdAt } = order;
        const deduplicationId = `${orderId}-${createdAt}`;
        const sqsParams = {
          QueueUrl: queueUrl!,
          MessageBody: JSON.stringify(order),
          MessageGroupId: 'OrderProcessing',
          MessageDeduplicationId: deduplicationId,
        };

        await sqs.sendMessage(sqsParams).promise();
        console.log("order added to sqs", order.id, queueUrl)
    }
  }
};
