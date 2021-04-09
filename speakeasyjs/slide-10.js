'use strict'

const chalk = require('chalk')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ EventBridge Lambda target

${await cat('./handler-snippet.js')}
`
