const {
  EventBridgeClient,
  PutEventsCommand
} = require('@aws-sdk/client-eventbridge')

exports.handler = async function trigger (event) {
  const changes = event.Records.filter(({ eventName }) =>
    ['INSERT', 'MODIFY'].includes(eventName)
  ).reduce((sum, { dynamodb: { Keys: { pk: { S: pk }, sk: { S: sk } } } }) => {
    if (!pk.endsWith('#stream')) return sum
    const log = pk.split('#')[0]
    sum[log] = sum[log] || []
    sum[log].push({ key: { pk, sk } })
    return sum
  }, {})

  const eventBridge = new EventBridgeClient({
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
        Entries: batch.map(({ key }) => ({
          EventBusName: 'dynamodb-log',
          Source: 'dynamodb-log',
          DetailType: 'stream changes',
          Detail: JSON.stringify({ log, key })
        }))
      }
      console.log('putEvents', params)
      const command = new PutEventsCommand(params)
      await eventBridge.send(command)
    }
  }
}
