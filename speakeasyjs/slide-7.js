'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ Design decisions

Early on I decided on using DynamoDB, it scales well and is very cost efficient

Like all AWS docs you need to read them a few hundred times until it sinks in....(and repeat)

I made a lot of mistakes, but still ended up sticking with DynamoDB

Checkout the great book by Alex DeBrie to learn more about DynamoDB ({cyanBright https://dynamodbbook.com})

A few things that level-eventstore had which didn't fit when moving to serverless

{green ●} no long running processing polling with websockets
{green ●} constraints in DynamoDB meant rethinking some of the flexibility
{green ●} it ended up not being a rewrite, rather a rethink.

The current design is

{green ●} a single DynamoDB table for all logs
{green ●} numerical sort keys
{strikethrough {dim ● ULID (Universally Unique Lexicographically Sortable Identifier)}}
{green ●} DynamoDB Streams
{green ●} EventBridge
{green ●} AWS Lambda
`
