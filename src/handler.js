const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb')
const { unmarshall } = require('@aws-sdk/util-dynamodb')
const path = require('path')
const os = require('os')
const { stat, writeFile, readFile } = require('fs').promises

const SEQUENCES_PATH = path.join(os.tmpdir(), 'sequences.json')

exports.handler = async function user ({
  detail: {
    key: { sk, pk }
  }
}) {
  const sequences = (await stat(SEQUENCES_PATH).catch(f => false))
    ? JSON.parse(await readFile(SEQUENCES_PATH))
    : {}

  const current = sequences[pk] || '\x00'
  console.log({ pk, sk, sequences })
  const dynamodb = new DynamoDBClient({
    convertEmptyValues: true,
    ...(process.env.IS_OFFLINE && {
      endpoint: 'http://127.0.0.1:8000',
      region: 'us-east-1',
      accessKeyId: 'x',
      secretAccessKey: 'x'
    })
  })

  const command = new QueryCommand({
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: '#pk = :pk and #sk > :sk',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk'
    },
    ExpressionAttributeValues: {
      ':pk': { S: pk },
      ':sk': { S: current }
    },
    Limit: 1
  })

  const { Items: rawItems } = await dynamodb.send(command)

  const size = rawItems.length
  if (size > 0) {
    const items = rawItems.map(unmarshall)
    sequences[pk] = items[size - 1].sk
    console.log(`next record > ${current}`)
    console.log(JSON.stringify({ items }, null, 2))
    await writeFile(SEQUENCES_PATH, JSON.stringify(sequences))
  } else {
    console.log(`no new record > ${current}`)
  }
}
