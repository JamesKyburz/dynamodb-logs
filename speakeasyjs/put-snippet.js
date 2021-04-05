dynamodb
  .put({
    TableName: `${stage}-dynamodb-logs`,
    Item: {
      pk: '<log name>#<id>#stream',
      sk: <numeric version (increments of 1)>,
      type: '<type name of event>',
      log: '<log name>',
      payload: { id: <id>, ...  }
    },
    ConditionExpression: 'attribute_not_exists(pk)'
  })
  .promise()
