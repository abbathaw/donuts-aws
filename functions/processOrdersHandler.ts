import { SQSEvent, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (let record of event.Records) {
    const order = JSON.parse(record.body);
    console.log(`Processing order: ${order.orderId}`);
  }
};
