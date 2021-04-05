'use strict'

const chalk = require('chalk')
const shell = require('./shell')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ Some access patterns

{bold EventBridge}

Read model builder processing events in order

{green ●} typically concurrency 1 or SQS
{green ●} can query DynamoDB in order for a given partition key
{green ●} idempotent
{green ●} only interested in a given partition key
{green ●} fire and forget - access events in any order no need for DynamoDB access (for small events)

{bold Direct DynamoDB queries}

{green ●} Query with a partition key and get all events in order (descending or ascending)
{green ●} Query with a partition key and sort key > ? if sort key is known
{green ●} If both the partition key and sort key are known use get
`
