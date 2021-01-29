const DynamoDB = require('aws-sdk/clients/dynamodb')
const path = require('path')
const os = require('os')
const { stat, writeFile } = require('fs').promises

const SEQUENCES_PATH = path.join(os.tmpdir(), 'sequences.json')

exports.handler = async function user ({
  detail: {
    key: { sk, pk }
  }
}) {
  const sequences = (await stat(SEQUENCES_PATH).catch(f => false))
     ? require(SEQUENCES_PATH)
     : {}

  const current = sequences[pk] || '\x00'
  console.log({ pk, sk, sequences })
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
        ':sk': current,
      },
      Limit: 1
    })
    .promise()

  const size = items.length
  if (size > 0) {
    sequences[pk] = items[size - 1]['sk']
    console.log(`next record > ${current}`)
    console.log(JSON.stringify({ items }, null, 2))
    await writeFile(SEQUENCES_PATH, JSON.stringify(sequences))
  } else {
    console.log(`no new record > ${current}`)
  }
}
