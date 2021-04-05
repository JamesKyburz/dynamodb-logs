'use strict'

const chalk = require('chalk')
const cat = require('./cat')
const readline = require('readline')

module.exports = async () => chalk`
⚡ So the talk 🙂

Ok, so what this talk is is changing this to to run in AWS Lambda.
${readline.cursorTo(process.stdout, 0, 6) && ''}
${await cat('./append-snippet.js')}
`
