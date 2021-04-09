'use strict'

const chalk = require('chalk')
const shell = require('./shell')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ Dynamodb read model config

{green ●} string partition key
{green ●} string sort key

`
