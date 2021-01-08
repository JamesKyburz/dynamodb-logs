const DynamoDB = require('aws-sdk/clients/dynamodb')

exports.handler = async function trigger (event) {
  const docClient = new DynamoDB.DocumentClient({ convertEmptyValues: true })
  const map = docClient.getTranslator()
  const Shape = docClient.service.api.operations.getItem.output.members.Item
  const records = event.Records.filter(({ eventName }) =>
    ['INSERT', 'MODIFY'].includes(eventName)
  )
    .map(x => map.translateOutput(x.dynamodb.NewImage, Shape))
    .reduce((sum, item) => {
      sum[item.entity] = sum[item.entity] || []
      sum[item.entity].push(item)
      return sum
    }, {})

  const bySk = (a, b) => {
    if (a.sk > b.sk) {
      return 1
    } else if (a.sk < b.sk) {
      return -1
    } else {
      return 0
    }
  }

  if (records['stream-tail']) {
    console.log(JSON.stringify(records['stream-tail'].sort(bySk), null, 2))
  } else if (records['stream']) {
    console.log(JSON.stringify(records['stream'].sort(bySk), null, 2))
  }
}
