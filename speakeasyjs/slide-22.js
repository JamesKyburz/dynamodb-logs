'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ Finishing up

{bold Known issues}

{green ●} AWS archive replays as fast as possible, order is not necessarily preserved
{green ●} EventBridge does not guarantee ordering
{green ●} ordering is hard
{green ●} this repo is hopefully a good starting point

{bold Offline}

{green ●} currently no EventBridge input transformation support
{green ●} target rule matching not feature complete
{green ●} send pull requests to https://www.npmjs.com/package/serverless-offline-aws-eventbridge

{bold Billing}

This repo has been deployed in us-east-1 for the last 3 or so months, I have sent thousands of events
and so far it has cost 0.
Billing needs to be monitored, and I would always suggest to have billing alerts in place to avoid suprises.
`
