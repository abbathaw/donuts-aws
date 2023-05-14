const AWS = require("aws-sdk");
const S3 = new AWS.S3();
const DynamoDB = new AWS.DynamoDB.DocumentClient();


const CAPACITY_TABLE_NAME = process.env.CAPACITY_TABLE_NAME;


exports.handler = async (event) => {
  console.log('event', event);
  
  return;
  
};
