'use strict'

const chalk = require('chalk')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ EventBridge Archive

Archive and Replay Events!

However there is no such thing in offline 😱

Let's fix that!

${await cat('./sqlite-snippet.js')}

Offline demo!
`
