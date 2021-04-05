const detailWithPayload = { log, key, type, payload }
const detailLessPayload = {
  ...detailWithPayload,
  partial: true,
  payload: { id }
}
eventBridge
  .putEvents([
    {
      EventBusName: 'dynamodb-log',
      Source: 'dynamodb-log',
      DetailType: 'stream changes',
      Detail: JSON.stringify(
        detailWithPayload.length <= 10240
          ? detailWithPayload
          : detailLessPayload
      )
    }
  ])
  .promise()
