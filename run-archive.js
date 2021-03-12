#!/usr/bin/env node

'use strict'

const execa = require('execa')
const { prompt } = require('inquirer')
const chalk = require('chalk')
const sqlite3 = require('sqlite3')
const datePrompt = require('date-prompt')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const EventBridge = require('aws-sdk/clients/eventbridge')
const WebSocket = require('ws')

const localDynamodb = new DynamoDB.DocumentClient({
  convertEmptyValues: true,
  endpoint: 'http://127.0.0.1:8000',
  region: 'us-east-1',
  accessKeyId: 'x',
  secretAccessKey: 'x'
})

const localEventBridge = new EventBridge({
  apiVersion: '2015-10-07',
  endpoint: 'http://127.0.0.1:4010',
  accessKeyId: 'x',
  secretAccessKey: 'x',
  region: 'us-east-1'
})

const shell = (command, opt) =>
  execa.command(command, { shell: '/bin/bash', ...opt })

async function run () {
  const { location } = await prompt({
    type: 'list',
    name: 'location',
    message: 'from which archive?',
    choices: ['sqlite3', 'aws']
  })

  const { action } = await prompt({
    type: 'list',
    name: 'action',
    message: 'replay action?',
    choices: [
      'post to local EventBridge',
      'write to local DynamoDB',
      'replay to AWS EventBridge'
    ]
  })

  async function send (events) {
    if (action === 'post to local EventBridge') {
      const params = {
        Entries: events.map(event => ({
          EventBusName: 'dynamodb-log',
          Source: event.source,
          DetailType: event['detail-type'],
          Detail: JSON.stringify({ ...event.detail, 'replay-name': 'local' })
        }))
      }
      console.log(chalk.green(`sending ${events.length} events to EventBridge`))
      await localEventBridge.putEvents(params).promise()
      return events.length
    } else {
      const items = {}
      for (const event of events) {
        const key = event.detail.key.pk + ',' + event.detail.key.sk
        if (!items[key]) {
          items[key] = event
        }
      }
      const putRequestItems = Object.values(items)
      const { UnprocessedItems: unprocessedItems } = await localDynamodb
        .batchWrite({
          RequestItems: {
            'local-dynamodb-logs': putRequestItems.map(event => ({
              PutRequest: {
                Item: {
                  ...event.detail.key,
                  log: event.detail.log,
                  type: event.detail.type,
                  payload: event.detail.payload
                }
              }
            }))
          }
        })
        .promise()
      if (Object.keys(unprocessedItems).length) {
        throw new Error(`unprocessed ${JSON.stringify(unprocessedItems)}`)
      }
      return putRequestItems.length
    }
  }

  if (location === 'sqlite3') {
    const db = new sqlite3.Database('db', sqlite3.OPEN_READONLY)
    let offset = 0
    let written = 0
    const from = await datePrompt('Start date?')
    const to = await datePrompt('End date?')
    while (true) {
      const limit = 10
      const rows = await new Promise((resolve, reject) => {
        db.all(
          `select * from events where createdAt >= ? and createdAt <= ? limit ${limit} offset ${offset} `,
          from,
          to,
          (err, rows) => (err ? reject(err) : resolve(rows))
        )
      })
      if (!rows.length) break
      const events = rows.map(row => JSON.parse(row.payload))
      written += await send(events)
      offset += limit
    }

    if (written > 0) {
      console.log(
        chalk.bold(`processed ${written} events between ${from} and ${to}`)
      )
    } else {
      console.log(`no events found in archive between ${from} and ${to}`)
    }
  } else if (location === 'aws') {
    if (action !== 'replay to AWS EventBridge') {
      const { stage } = await prompt({
        type: 'list',
        name: 'stage',
        message: 'state?',
        choices: ['dev', 'prod']
      })
      try {
        await shell(
          `
          log_info() { echo -e "\\033[0m\\033[0;36m\${*}\\033[0m"; }
          log_info 'verfying local archive replay stack (needed to local replay)'
          stage=${stage}
          external_ip4_address="$(curl ifconfig.me/ip --silent)"
          export external_ip4_address="\${external_ip4_address:?}"
          stack_id=$(aws cloudformation describe-stacks | jq -r ".Stacks | .[] | select(.StackName | contains(\\"dynamodb-logs-local-archive-replay-\${stage:?}\\")) | .StackId")
          deploy_needed=1
          if [[ -n "\${stack_id:-}" ]]; then
            allowed_ip4_addresses=$(aws lambda get-function-configuration --function-name dynamodb-logs-local-archive-replay-\${stage:?}-websocket | jq -r '.Environment.Variables.allowed_ip')
            if [[ \${allowed_ip4_addresses:-none?} =~ \${external_ip4_address:?} ]]; then
              deploy_needed=0
            else
              export external_ip4_address="\${allowed_ip4_addresses:-},\${external_ip4_address:?}"
              log_info 'adding local ip4 ip address to websocket function'
              npx sls -c serverless-local-archive-run.yml --stage dev deploy --function websocket
              deploy_needed=0
            fi
          fi
          if [[ \${deploy_needed:?} -eq 1 ]]; then
            log_info 'deploy local archive replay stack'
            npx sls -c serverless-local-archive-run.yml --stage dev deploy
          fi
        `,
          { stdio: 'inherit' }
        )
      } catch (err) {
        console.error(chalk.red(`failed to run replay ${err}`))
      }
      const { stdout: wssUrl } = await shell(
        `
        stack_id=$(aws cloudformation describe-stacks | jq -r ".Stacks | .[] | select(.StackName | contains(\\"dynamodb-logs-local-archive-replay-${stage}\\")) | .StackId")
        websocket_url=$(aws apigatewayv2 get-apis | jq -r ".Items | .[] | select(.Name | contains(\\"${stage}-dynamodb-logs-local-archive-replay-websockets\\")) | .ApiEndpoint")
        echo \${websocket_url}/${stage}
      `,
        { stderr: 'inherit' }
      )
      const ws = new WebSocket(wssUrl)
      await new Promise((resolve, reject) =>
        ws.on('open', err => (err ? reject(err) : resolve()))
      )

      const messages = []

      ws.on('message', data => {
        messages.push(JSON.parse(data))
      })

      console.log(chalk.cyan(`will receive events via ${wssUrl}`))
      console.log(chalk.bold('select the local replay as the event target'))
      await shell('npx @mhlabs/evb-cli replay --eventbus dynamodb-log', {
        stdio: 'inherit'
      })
      console.log(chalk.green('running replay, waiting for events'))

      let written = 0

      while (true) {
        if (messages.length > 0) {
          const pending = messages.splice(0, messages.length)
          while (pending.length) {
            const batch = pending.splice(0, 10)
            written += await send(batch)
          }
          console.log(chalk.bold(`processed ${written} events`))
        }
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } else {
      console.log(chalk.bold('select event targets omitting local replay'))
      await shell('npx @mhlabs/evb-cli replay --eventbus dynamodb-log', {
        stdio: 'inherit'
      })
    }
  }
}

run().catch(err => console.error(chalk.red(err.toString())))