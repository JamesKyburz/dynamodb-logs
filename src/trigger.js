'use strict'

const EventBridge = require('aws-sdk/clients/eventbridge')
const DynamoDB = require('aws-sdk/clients/dynamodb')

exports.handler = async function trigger (event) {
  console.log(JSON.stringify(event, null, 2))
  const docClient = new DynamoDB.DocumentClient({ convertEmptyValues: true })
  const map = docClient.getTranslator()
  const Shape = docClient.service.api.operations.getItem.output.members.Item

  const changes = event.Records.filter(({ eventName }) =>
    ['INSERT', 'MODIFY'].includes(eventName)
  )
    .map(x => map.translateOutput(x.dynamodb.NewImage, Shape))
    .reduce((sum, { pk, sk, type, payload, log }) => {
      if (!pk.endsWith('#stream')) return sum
      sum[log] = sum[log] || []
      sum[log].push({ key: { pk, sk }, type, payload })
      return sum
    }, {})

  const eventBridge = new EventBridge({
    apiVersion: '2015-10-07',
    ...(process.env.IS_OFFLINE && {
      endpoint: 'http://127.0.0.1:4010',
      accessKeyId: 'x',
      secretAccessKey: 'x',
      region: 'us-east-1'
    })
  })

  for (const [log, items] of Object.entries(changes)) {
    while (items.length) {
      const batch = items.splice(0, 10)
      const params = {
        Entries: batch.map(({ key, type, payload }) => {
          const detailWithPayload = JSON.stringify({ log, key, type, payload })
          const detailLessPayload = JSON.stringify({ log, key, type })
          return {
            EventBusName: 'dynamodb-log',
            Source: 'dynamodb-log',
            DetailType: 'stream changes',
            Detail:
              detailWithPayload.length <= 10240
                ? detailWithPayload
                : detailLessPayload
          }
        })
      }
      console.log('putEvents', params)
      await eventBridge.putEvents(params).promise()
    }
  }
}
