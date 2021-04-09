'use strict'

const chalk = require('chalk')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ DynamoDB design

DynamoDB {bold.green →} DynamoDB Stream {bold.green →} AWS Lambda Trigger {bold.green →} EventBridge
using Change Data Capture for DynamoDB Streams

{green ●} A time ordered sequence of item level changes (partion keys) is captured
{green ●} This data is held for 24 hours
{green ●} Changes to DynamoDB get picked up by a lambda function
{green ●} Changes are posted to EventBridge

Everytime we write to DynamoDB the data is sent to EventBridge and all subscribers get notified

We use {underline conditional writes} to ensure immutable insertions.

${await cat('./put-snippet.js')}
`
