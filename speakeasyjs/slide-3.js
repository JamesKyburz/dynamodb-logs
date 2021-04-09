'use strict'

const chalk = require('chalk')
module.exports = async () => chalk`
⚡ How things went

{bold Things that worked}

{green ●} running the stack locally with real data thanks to replay
{green ●} full insight to state changes, because every change was in the log
{green ●} creating new projections for existing events
{green ●} replacing projection databases with zero downtime

{bold Things that didn't}

{green ●} level-eventstore didn't scale as used a single instance to maintain the event sequence numbers

{bold Some things I learned in the process}

{green ●} make all id's deterministic (use a hash)
{green ●} side effect free and idempotency is a must

{bold Some things are harder, but it's worth it}

{strikethrough {dim ● updating the read models directly}}
{green ●} creating one time tasks for fixing state

Then I started playing with serverless (this is about 4 years ago)
`
