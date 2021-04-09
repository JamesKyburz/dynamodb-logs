'use strict'

const chalk = require('chalk')
module.exports = async () => chalk`
⚡ Background

I previously built {cyanBright level-eventstore} for {cyanBright https://www.advized.se}

When I built level-eventstore I wanted an append only log with the following characteristics :-

{green ●} {bold log of events per bounded context} ordered by time of insertion
{green ●} {bold replay} ability (local and remote)
{green ●} {bold pubsub} for projections (Elasticsearch, LevelDB, DynamoDB, RethinkDB, S3)

level-eventstore was built using LevelDB and Node.

It was inspired by CQRS (Command Query Responsibility Segregation) / Event Sourcing, but much simpler.

I starting building small services that used this log, and things went well.

Each bounded context had it's own log (Users, Products, Etc)

The stack was initially a monorepo deployed using Docker containers.
`
