'use strict'

const chalk = require('chalk')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ DynamoDB design

DynamoDB {bold.green →} DynamoDB Stream {bold.green →} AWS Lambda Trigger {bold.green →} EventBridge
using Change Data Capture for DynamoDB Streams

{green ●} a time ordered sequence of item level changes (per partition key) is captured
{green ●} this data is held for 24 hours
{green ●} changes to DynamoDB get picked up by a Lambda function
{green ●} changes are posted to EventBridge

Every time we write to DynamoDB the data is sent to EventBridge and all subscribers get notified

We use {underline conditional writes} to ensure immutable insertions

${await cat('./put-snippet.js')}
`
