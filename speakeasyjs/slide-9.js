'use strict'

const chalk = require('chalk')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ EventBridge

The AWS Lambda triggered by DynamoDB Streams sends changes to EventBridge

${await cat('./put-events-snippet.js')}

More on constraints in a bit 🙂
`
