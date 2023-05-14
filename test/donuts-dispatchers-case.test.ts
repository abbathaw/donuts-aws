import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as DonutsDispatchersCase from '../lib/donuts-dispatchers-case-stack';

test('SQS QueueCreated', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new DonutsDispatchersCase.DonutsDispatchersCaseStack(app, 'MyTestStack');
  // THEN

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SQS::Queue', {
    VisibilityTimeout: 300
  });
  template.resourceCountIs('AWS::SNS::Topic', 1);
});
