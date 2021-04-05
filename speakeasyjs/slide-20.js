'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ Preparing for AWS deploy

{bold IAM}

I use {cyanBright https://github.com/iann0036/iamlive} to help with IAM rules.
iamlive needs to have CSM (Client Side Monitoring) enabled

The plugin {cyanBright serverless-iam-roles-per-function} helps with granular permissions.

Demo
`
