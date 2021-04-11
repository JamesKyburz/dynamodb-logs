'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ Recap

The first challenge with serverless is getting everything running locally

These plugins make that possible using the serverless framework

{green ●} serverless-dynamodb-local
{green ●} serverless-offline
{green ●} serverless-offline-dynamodb-streams
{green ●} serverless-offline-aws-eventbridge
{green ●} serverless-plugin-conditional-functions

And the debugging tool for EventBridge {cyanBright https://github.com/mhlabs/evb-cli} by the MatHem tech team
`
