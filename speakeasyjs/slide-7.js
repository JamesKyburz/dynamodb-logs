'use strict'

const chalk = require('chalk')
const cat = require('./cat')
const readline = require('readline')

module.exports = async () => chalk`
⚡ Design decisions

Early on I decided on using DynamoDB, it scales well and was is very cost efficient.

Like all AWS docs you need to read them a few hundred times until it sinks in....(and repeat)

I made a lot of mistakes, but still ended up sticking with DynamoDB.

Checkout the great book by Alex DeBrie to learn more about DynamoDB ({cyanBright https://dynamodbbook.com})

A few things that level-eventstore had which didn't fit when moving to serverless.

{green ●} no long running processing polling with websockets
{green ●} constraints in DynamoDB meant rethinking some of the flexibility
{green ●} it ended up not being a rewrite, rather a rethink...

The current design is

{green ●} A single DynamoDB table for all logs
{green ●} Numerical sort keys
{strikethrough ● Universally Unique Lexicographically Sortable Identifier}
{green ●} DynamoDB Streams
{green ●} EventBridge
{green ●} AWS Lambda
`
