'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ Error handling and retries

{green ●} DynamoDB streams keep data for 24 hours

These apply before invocation

{green ●} EventBridge will retry 185 times for up to 24 hours
{green ●} EventBridge can be configured to use a DLQ (Dead letter queue)
{green ●} Lambda will attempt to call your function for 6 hours (async)

These apply after invocation

{green ●} max 3 attempts to call a AWS Lambda Function
{green ●} DLQ / Destinations can be configured
`
