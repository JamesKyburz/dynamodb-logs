'use strict'

const chalk = require('chalk')
module.exports = async () => chalk`
⚡ Background

I previously built {cyanBright https://github.com/JamesKyburz/level-eventstore} for {cyanBright https://www.advized.se}

When I built level-eventstore I wanted an append only log with the following characteristics :-

{green ●} full insight to all state changes
{green ●} log of events per bounded context ordered by time of insertion
{green ●} replay ability (local and remote)
{green ●} pubsub for projections (Elasticsearch, LevelDB, DynamoDB, RethinkDB, S3)

level-eventstore was built using LevelDB and Node

It was inspired by CQRS (Command Query Responsibility Segregation) / Event Sourcing, but much simpler

{cyanBright https://arkwright.github.io/event-sourcing.html}

{reset         ┌───────────────────────────────────┐
 ┌──────┴┐                                  │              I starting building small services
 │       │   ┌───────┬───┬───┬───┬───┬───┐  │  ┌─────────┐ that used this log, and things went well
 │  {cyan App}  │   │ {cyan Event} │   │   │   │   │   │  │  │ {cyan Some}    │
 │       │ ┌─│ {cyan Log}   │ {cyan 1} │ {cyan 2} │ {cyan 3} │ {cyan 4} │ {cyan 5} │◀─┘  │ {cyan Service} │ Users, Products etc had their own logs
 └───────┘ │ └───────┴───┴───┴───┴───┴───┘     └────┬──┬─┘
           └────────────────────────────────────────┘  │   The stack was initially a monorepo
                                               ╭────╮  │   deployed as using Docker containers
                                               │ {cyan DB} │◀─┘
                                               ╰────╯}
`
