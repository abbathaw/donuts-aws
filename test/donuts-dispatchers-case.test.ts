import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as DonutsDispatchersCase from '../lib/donuts-dispatchers-case-stack';

test('SQS QueueCreated as FIFO', () => {
  const app = new cdk.App();
  const stack = new DonutsDispatchersCase.DonutsDispatchersCaseStack(app, 'MyTestStack');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SQS::Queue', {
    VisibilityTimeout: 300,
    FifoQueue: true
  });
});
