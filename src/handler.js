'use strict'

const DynamoDB = require('aws-sdk/clients/dynamodb')
const path = require('path')
const os = require('os')
const { stat, writeFile, readFile } = require('fs').promises

exports.handler = async function user (event) {
  const {
    detail: {
      key: { sk, pk }
    }
  } = event
  const sequencePath = path.join(os.tmpdir(), `sequences-${pk}.txt`)
  const current = Number(
    (await stat(sequencePath).catch(f => false))
      ? await readFile(sequencePath)
      : '0'
  )

  console.log(JSON.stringify({ event, current }, null, 2))

  if (sk < current + 1) {
    return
  }

  const dynamodb = new DynamoDB.DocumentClient({
    convertEmptyValues: true,
    ...(process.env.IS_OFFLINE && {
      endpoint: 'http://127.0.0.1:8000',
      region: 'us-east-1',
      accessKeyId: 'x',
      secretAccessKey: 'x'
    })
  })

  const { Items: items } = await dynamodb
    .query({
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: '#pk = :pk and #sk > :sk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      },
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': current
      },
      Limit: 1
    })
    .promise()

  if (items.length === 1) {
    console.log(`next record > ${current}`)
    console.log(JSON.stringify({ items }, null, 2))
    await writeFile(sequencePath, String(items[0].sk))
  } else {
    console.log(`no new record > ${current}`)
  }
}
