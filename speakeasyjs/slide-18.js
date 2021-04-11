'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
😱 EventBridge constraints

{green ●} each item has a max size of 256KB

Invocations and transactions per region are all soft limits

{bold Event Bus}

{green ●} max 100 buses per account
{green ●} max 300 rules per bus
{green ●} max 5 targets per rule
`
