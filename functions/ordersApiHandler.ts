import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ORDERS_TABLE_NAME || "Orders";

const orderSchema = Joi.object({
  companyId: Joi.string().required(),
  deliveryDate: Joi.string().isoDate().required(),
  donuts: Joi.number().integer().min(1).required()
});


export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.body){
    return { statusCode: 400, body: JSON.stringify({"message": "Your need to provide the order payload"}) };
  }
  const order = JSON.parse(event.body);

  const { error } = orderSchema.validate(order);
  if (error) {
    return { statusCode: 400, body: JSON.stringify({"message": "Invalid order payload", "details": error.details}) };
  }
  order.orderId = uuidv4();
  order.createdAt = new Date().toISOString();

  const params = {
    TableName: tableName,
    Item: order,
  };

  try {
    await dynamo.put(params).promise();
    return { statusCode: 200, body: JSON.stringify(order) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: 'Error in saving order.' };
  }
};
