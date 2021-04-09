'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ Known issues

{green ●} AWS archive replays as fast as possible, order is not preserved
{green ●} ordering is hard
{green ●} this repo is hopefully a good starting point

{bold Offline}

{green ●} currently no eventbridge input transformation support
{green ●} target rule matching not feature complete
{green ●} send pull requests to https://www.npmjs.com/package/serverless-offline-aws-eventbridge
`
