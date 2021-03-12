const DynamoDB = require('aws-sdk/clients/dynamodb')
const ApiGatewayManagementApi = require('aws-sdk/clients/apigatewaymanagementapi')

exports.handler = async function localReplay (event) {
  const dynamodb = new DynamoDB.DocumentClient({ convertEmptyValues: true })
  const tableName = process.env.DYNAMODB_TABLE
  const { Items: items } = await dynamodb
    .query({
      TableName: tableName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#cid': 'connectionId',
        '#ep': 'endpoint',
        '#rn': 'replayName'
      },
      ExpressionAttributeValues: {
        ':pk': 'websocket#connection'
      },
      ProjectionExpression: '#cid, #ep, #rn'
    })
    .promise()

  if (!items.length) return
  const matched = items.filter(item => item.replayName === event['replay-name'])
  if (!matched.length) return

  const apigateway = new ApiGatewayManagementApi({
    endpoint: items[0].endpoint
  })

  await Promise.all(
    matched.map(item => {
      return apigateway
        .postToConnection({
          ConnectionId: item.connectionId,
          Data: JSON.stringify(event)
        })
        .promise()
    })
  )
}
