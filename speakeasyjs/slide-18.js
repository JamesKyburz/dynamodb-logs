'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
😱 EventBridge constraints

{green ●} Each item has a max size of 256KB

Invocations and transactions per region are all softs limits

{bold Event Bus}

{green ●} max 100 buses per account
{green ●} max 300 rules per bus
{green ●} max 5 targets per rule
`
