'use strict'

const DynamoDB = require('aws-sdk/clients/dynamodb')

const allowedIps = (process.env.allowed_ip || '').split(',').filter(Boolean)
const stage = process.env.stage || 'dev'

exports.handler = async function websocket (event) {
  console.log(JSON.stringify(event, null, 2))
  const ok = allowedIps.includes(event.requestContext.identity.sourceIp)

  if (ok) await register(event)

  return {
    statusCode: ok ? 200 : 401
  }
}

async function register ({
  headers: { 'replay-name': replayName },
  requestContext: { eventType, requestTimeEpoch, connectionId, domainName }
}) {
  const pk = 'websocket#connection'
  const dynamodb = new DynamoDB.DocumentClient({ convertEmptyValues: true })
  const tableName = process.env.DYNAMODB_TABLE
  const endpoint = `https://${domainName}/${stage}`
  if (eventType === 'CONNECT') {
    const sk = requestTimeEpoch
    await dynamodb
      .put({
        TableName: tableName,
        Item: {
          pk,
          sk,
          connectionId,
          endpoint,
          replayName
        }
      })
      .promise()
  } else if (eventType === 'DISCONNECT') {
    const { Items: items } = await dynamodb
      .query({
        TableName: tableName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sk': 'sk',
          '#cid': 'connectionId'
        },
        ExpressionAttributeValues: {
          ':pk': pk
        },
        ProjectionExpression: '#cid, #sk'
      })
      .promise()
    for (const item of items) {
      console.log('each', JSON.stringify(item))
      if (item.connectionId === connectionId) {
        const sk = item.sk
        console.log('delete', JSON.stringify({ pk, sk }))
        await dynamodb
          .delete({
            TableName: tableName,
            Key: {
              pk,
              sk
            }
          })
          .promise()
      }
    }
  }
}
