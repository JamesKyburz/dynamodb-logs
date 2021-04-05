'use strict'

const execa = require('execa')
const chalk = require('chalk')

module.exports = async (command, opt) => {
  process.stdout.write('\x1b[?1005l')
  process.stdout.write('\x1b[?1003l')
  process.stdin.removeAllListeners('keypress')
  const result = await execa.command(command, {
    shell: '/bin/bash',
    cwd: __dirname,
    ...opt
  })
  return result
}
