#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DonutsDispatchersCaseStack } from '../lib/donuts-dispatchers-case-stack';

const app = new cdk.App();
new DonutsDispatchersCaseStack(app, 'DonutsDispatchersCase');
