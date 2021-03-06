'use strict'

const chalk = require('chalk')

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

{green ●} query with a partition key and get all events in order (descending or ascending)
{green ●} query with a partition key and sort key > ? if sort key is known
{green ●} if both the partition key and sort key are known use get
`
