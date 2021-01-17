const DynamoDB = require('aws-sdk/clients/dynamodb')
exports.handler = async function user ({ detail: { pk } }) {
  const sk = '\x00'
  const dynamodb = new DynamoDB.DocumentClient({
    convertEmptyValues: true,
    ...(process.env.IS_OFFLINE && {
      endpoint: 'http://127.0.0.1:8000',
      region: 'us-east-1',
      accessKeyId: 'x',
      secretAccessKey: 'x'
    })
  })
  const { Items } = await dynamodb
    .query({
      //TableName: process.env.DYNAMODB_TABLE,
      TableName: 'local-dynamodb-logs',
      KeyConditionExpression: '#pk = :pk and #sk > :sk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      },
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': sk
      }
    })
    .promise()

  console.log(JSON.stringify({ Items }, null, 2))
}
