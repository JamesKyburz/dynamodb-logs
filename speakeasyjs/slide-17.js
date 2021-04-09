'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
😱 DynamoDB Constraints

{green ●} Each item has a max size of 400KB
{green ●} Calculating size includes keys
{green ●} 3000 RCU (Read capacity units) per partion key
{green ●} 1000 WCU (Write capacity units) per partion key

1 RCU is either 1 strongly consistent read per second
or
2 strongly consistent reads per second
for items of 4KB in size

{green ●} A query can never return more than 1MB

other limits are soft limits which can be increased.
`
