#!/usr/bin/env node

'use strict'

const { prompt } = require('inquirer')
const faker = require('faker')
const readline = require('readline')
const { promises: fs, createReadStream, createWriteStream } = require('fs')
const { EOL } = require('os')
const DynamoDB = require('aws-sdk/clients/dynamodb')

async function run () {
  const { env } = await prompt({
    type: 'list',
    name: 'env',
    message: 'generate fake data for?',
    choices: ['local', 'aws']
  })

  const stage =
    env === 'local'
      ? env
      : (
          await prompt({
            type: 'list',
            name: 'stage',
            message: 'stage?',
            choices: ['dev', 'prod']
          })
        ).stage

  const dynamodb = new DynamoDB.DocumentClient({
    convertEmptyValues: true,
    ...(env === 'local' && {
      endpoint: 'http://127.0.0.1:8000',
      region: 'us-east-1',
      accessKeyId: 'x',
      secretAccessKey: 'x'
    })
  })

  const { max } = await prompt({
    type: 'number',
    name: 'max',
    message: 'how many users?'
  })

  const ws = createWriteStream('./events.ldjson')

  const ids = []

  await new Promise((resolve, reject) => {
    ws.on('error', reject)
    ws.on('finish', resolve)
    let i = 0
    while (i++ < max) {
      const signup = createSignup()
      ws.write(JSON.stringify(signup) + EOL)
      const {
        payload: { id }
      } = signup
      ids.push(id)
    }
    for (const id of ids) {
      ws.write(JSON.stringify(addPhoneNumber(id)) + EOL)
    }
    for (const id of ids) {
      ws.write(JSON.stringify(verifyPhoneNumber(id)) + EOL)
    }
    for (const id of ids) {
      ws.write(JSON.stringify(addLocation(id)) + EOL)
    }
    ws.end()
  })

  const pending = []

  for await (const { pk, sk, type, log, payload } of readEvents()) {
    pending.push(
      dynamodb
        .put({
          TableName: `${stage}-dynamodb-logs`,
          Item: {
            pk,
            sk,
            type,
            log,
            payload
          }
        })
        .promise()
    )
    if (pending.length > 20) {
      await Promise.all(pending)
      pending.splice(0, pending.length)
    }
  }
  await Promise.all(pending)
}

run().catch(console.error)

function createSignup () {
  const name = faker.name.findName()
  const email = faker.internet.email()
  const id = faker.datatype.uuid()

  return {
    pk: `users#${id}#stream`,
    sk: 1,
    type: 'signup',
    log: 'users',
    payload: {
      id,
      name,
      email
    }
  }
}

function addPhoneNumber (id) {
  return {
    pk: `users#${id}#stream`,
    sk: 2,
    type: 'addPhoneNumber',
    log: 'users',
    payload: {
      id,
      phoneNumber: faker.phone.phoneNumber()
    }
  }
}

function verifyPhoneNumber (id) {
  return {
    pk: `users#${id}#stream`,
    sk: 3,
    type: 'verifyPhoneNumber',
    log: 'users',
    payload: {
      id
    }
  }
}

function addLocation (id) {
  return {
    pk: `users#${id}#stream`,
    sk: 4,
    type: 'addLocation',
    log: 'users',
    payload: {
      id,
      long: Number(faker.address.longitude()),
      lat: Number(faker.address.latitude())
    }
  }
}

async function * readEvents () {
  for await (const line of readline.createInterface({
    input: createReadStream('./events.ldjson')
  })) {
    yield JSON.parse(line)
  }
}
