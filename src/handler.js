'use strict'

const DynamoDB = require('aws-sdk/clients/dynamodb')

exports.handler = async function user (event) {
  const {
    detail: {
      key: { sk, pk },
      payload: { id } = {}
    }
  } = event

  console.log('products handler', JSON.stringify({ pk, sk, event }, null, 2))

  const dynamodb = new DynamoDB.DocumentClient({
    convertEmptyValues: true,
    ...(process.env.IS_OFFLINE && {
      endpoint: 'http://127.0.0.1:8000',
      region: 'us-east-1',
      accessKeyId: 'x',
      secretAccessKey: 'x'
    })
  })

  const userPk = id
    ? `users#${id}`
    : pk
        .split('#')
        .slice(0, -1)
        .join('#')

  const { Item: { version: currentVersion = 0 } = {} } = await dynamodb
    .get({
      TableName: process.env.DYNAMODB_PRODUCTS_TABLE,
      Key: {
        pk: userPk,
        sk: userPk
      },
      ConsistentRead: true,
      ExpressionAttributeNames: {
        '#version': 'version'
      },
      ProjectionExpression: '#version'
    })
    .promise()

  const { Items: logItems } = await dynamodb
    .query({
      TableName: process.env.DYNAMODB_LOGS_TABLE,
      KeyConditionExpression: '#pk = :pk and #sk > :sk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      },
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': currentVersion
      }
    })
    .promise()

  if (logItems.length === 0) {
    console.log(`no event found ${pk}, sk > ${currentVersion}`)
    return
  }

  for (const event of logItems) {
    if (event.sk < currentVersion) {
      console.log(
        `current version is higher, will ignore ${pk} ${event.sk} < ${currentVersion}`
      )
      return
    }

    const handler = getEventHandler(dynamodb, userPk, event)

    if (!handler) {
      console.error(`no event handler found for type ${event.type}`)
    } else {
      await handler(event)
    }
  }
}

function getEventHandler (dynamodb, pk, { type, payload: { id } }) {
  const sk = pk
  return {
    async signup ({ sk: version, payload: { name, email } }) {
      await dynamodb
        .put({
          TableName: process.env.DYNAMODB_PRODUCTS_TABLE,
          Item: {
            pk,
            sk,
            type: 'user',
            id,
            name,
            email,
            version
          },
          ConditionExpression: 'attribute_not_exists(pk)',
          ReturnValues: 'NONE'
        })
        .promise()
    },
    async addPhoneNumber ({ sk: version, payload: { phoneNumber } }) {
      await dynamodb
        .update({
          TableName: process.env.DYNAMODB_PRODUCTS_TABLE,
          ExpressionAttributeNames: {
            '#phoneNumber': 'phoneNumber',
            '#version': 'version'
          },
          ExpressionAttributeValues: {
            ':phoneNumber': phoneNumber,
            ':version': version,
            ':currentVersion': version - 1
          },
          Key: {
            pk,
            sk
          },
          UpdateExpression:
            'SET #phoneNumber = :phoneNumber, #version = :version',
          ConditionExpression: '#version = :currentVersion',
          ReturnValues: 'NONE'
        })
        .promise()
    },
    async verifyPhoneNumber ({ sk: version }) {
      await dynamodb
        .update({
          TableName: process.env.DYNAMODB_PRODUCTS_TABLE,
          ExpressionAttributeNames: {
            '#verifiedPhoneNumber': 'verifiedPhoneNumber',
            '#version': 'version'
          },
          ExpressionAttributeValues: {
            ':verifiedPhoneNumber': true,
            ':version': version,
            ':currentVersion': version - 1
          },
          Key: {
            pk,
            sk
          },
          UpdateExpression:
            'SET #verifiedPhoneNumber = :verifiedPhoneNumber, #version = :version',
          ConditionExpression: '#version = :currentVersion',
          ReturnValues: 'NONE'
        })
        .promise()
    },
    async addLocation ({ sk: version, payload: { long, lat } }) {
      await dynamodb
        .update({
          TableName: process.env.DYNAMODB_PRODUCTS_TABLE,
          ExpressionAttributeNames: {
            '#location': 'location',
            '#version': 'version'
          },
          ExpressionAttributeValues: {
            ':location': { long, lat },
            ':version': version,
            ':currentVersion': version - 1
          },
          Key: {
            pk,
            sk
          },
          UpdateExpression: 'SET #location = :location, #version = :version',
          ConditionExpression: '#version = :currentVersion',
          ReturnValues: 'NONE'
        })
        .promise()
    }
  }[type]
}
