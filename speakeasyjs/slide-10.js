'use strict'

const chalk = require('chalk')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ EventBridge lambda target

${await cat('./handler-snippet.js')}
`
