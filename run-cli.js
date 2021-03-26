#!/usr/bin/env node

'use strict'

const { prompt } = require('inquirer')
const execa = require('execa')
const chalk = require('chalk')

async function cli () {
  const shell = (command, opt) => {
    console.log(chalk.cyan(`executing ${command}`))
    return execa.command(command, { shell: '/bin/bash', ...opt })
  }

  while (true) {
    const { option } = await prompt({
      type: 'list',
      name: 'option',
      choices: [
        'exit',
        'interactive shell',
        'local cleanup',
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
    } else if (option === 'local cleanup') {
      const { deleteDb } = await prompt({
        name: 'deleteDb',
        type: 'confirm',
        default: false,
        message: 'delete sqlite db [n]?'
      })

      if (deleteDb) {
        await shell('rm -rf db', { stdio: 'inherit' })
      }

      const { composeDown } = await prompt({
        name: 'composeDown',
        type: 'confirm',
        default: true,
        message: 'docker-compose down [y]?'
      })

      if (composeDown) {
        await shell('./cli.sh stop', { stdio: 'inherit' })
        break
      }
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
            'npx sls offline start --stage=local -c serverless-node.yml',
            { stdio: 'inherit' }
          )
        } else if (option === 'deploy') {
          await shell('npx sls deploy --stage dev -c serverless-node.yml', {
            stdio: 'inherit'
          })
        } else if (option === 'remove deploy') {
          await shell('npx sls remove,--stage dev -c serverless-node.yml', {
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
            npx sls offline start --stage=local -c serverless-python.yml
          `,
            { stdio: 'inherit' }
          )
        } else if (option === 'deploy') {
          await shell(
            `
            . venv/bin/activate
            npx sls deploy --stage dev -c serverless-python.yml
          `,
            { stdio: 'inherit' }
          )
        } else if (option === 'remove deploy') {
          await shell(
            `
            . venv/bin/activate
            npx sls remove --stage dev -c serverless-python.yml
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
