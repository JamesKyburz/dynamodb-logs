'use strict'

const chalk = require('chalk')
const shell = require('./shell')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ Dynamodb logs config

{green ●} string partition key
{green ●} numeric sort key
{green ●} stream enabled with NEW_AND_OLD_IMAGES

`
