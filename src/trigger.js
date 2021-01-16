const EventBridge = require('aws-sdk/clients/eventbridge')

exports.handler = async function trigger (event) {
  const changes = event.Records.filter(({ eventName }) =>
    ['INSERT', 'MODIFY'].includes(eventName)
  ).reduce((sum, { dynamodb: { Keys: { pk: { S: pk } } } }) => {
    if (!pk.endsWith('#stream')) return sum
    const log = pk.split('#')[0]
    sum[log] = sum[log] || []
    if (!sum[log].includes(pk)) {
      sum[log].push(pk)
    }
    return sum
  }, {})

  const eventBridge = new EventBridge({
    apiVersion: '2015-10-07',
    ...(process.env.NODE_ENV === 'local' && { endpoint: 'http://127.0.0.1:4010' })
  })

  console.log(process.env.NODE_ENV)

  for (const [log, keys] of Object.entries(changes)) {
    while (keys.length) {
      const batch = keys.splice(0, 10)
      const params = {
        Entries: batch.map(pk => ({
          EventBusName: 'dynamodb-log',
          Source: 'dynamodb-log',
          DetailType: 'stream changes',
          Detail: JSON.stringify({ log, pk })
        }))
      }
      await eventBridge.putEvents(params).promise()
    }
  }
}
