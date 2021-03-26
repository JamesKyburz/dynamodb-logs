#!/usr/bin/env node

'use strict'

const { prompt } = require('inquirer')
const execa = require('execa')

async function cli () {
  const shell = (command, opt) =>
    execa.command(command, { shell: '/bin/bash', ...opt })

  while (true) {
    const { option } = await prompt({
      type: 'list',
      name: 'option',
      choices: [
        'exit',
        'interactive shell',
        'cleanup',
        'start offline',
        'deploy',
        'remove deploy',
        'create fake data',
        'replay from archive',
        'query local DynamoDB'
      ]
    })
    if (option === 'exit') {
      break
    } else if (option === 'cleanup') {
      await shell('./cli.sh stop', { stdio: 'inherit' })
    } else if (
      option === 'start offline' ||
      option === 'deploy' ||
      option === 'remove deploy'
    ) {
      const { nodeOrPython } = await prompt({
        type: 'list',
        name: 'nodeOrPython',
        choices: ['node', 'python']
      })
      if (nodeOrPython === 'node') {
        if (option === 'start offline') {
          await shell(
            'npx sls --stage=local -c serverless-node.yml offline start',
            { stdio: 'inherit' }
          )
        } else if (option === 'deploy') {
          await shell('npx sls -c serverless-node.yml --stage dev deploy', {
            stdio: 'inherit'
          })
        } else if (option === 'remove deploy') {
          await shell('npx sls -c serverless-node.yml --stage dev remove', {
            stdio: 'inherit'
          })
        }
      } else if (nodeOrPython === 'python') {
        await shell(
          `
          if ! [[ -d venv ]]; then
            virtualenv venv
          fi
          . venv/bin/activate
          pip3 install --no-cache-dir -r requirements.txt
        `,
          { stdio: 'inherit' }
        )
        if (option === 'start offline') {
          await shell(
            `
            . venv/bin/activate
            npx sls --stage=local -c serverless-python.yml offline start
          `,
            { stdio: 'inherit' }
          )
        } else if (option === 'deploy') {
          await shell(
            `
            . venv/bin/activate
            npx sls -c serverless-python.yml --stage dev deploy
          `,
            { stdio: 'inherit' }
          )
        } else if (option === 'remove deploy') {
          await shell(
            `
            . venv/bin/activate
            npx sls -c serverless-python.yml --stage dev remove
          `,
            { stdio: 'inherit' }
          )
        }
      }
    } else if (option === 'create fake data') {
      await shell(`./create-fake-data.js`, { stdio: 'inherit' })
    } else if (option === 'replay from archive') {
      await shell(`./run-archive.js`, { stdio: 'inherit' })
    } else if (option === 'query local DynamoDB') {
      await shell(`./dynamodb-local-query.sh`, { stdio: 'inherit' })
    } else {
      await shell('bash', {
        stdio: 'inherit',
        env: { ...process.env, __INTERACTIVE: 1 }
      })
      break
    }
  }
}

cli().catch(console.error)
