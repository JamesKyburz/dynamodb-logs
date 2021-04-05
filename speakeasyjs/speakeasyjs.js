#!/usr/bin/env node

'use strict'

const readline = require('readline')
const fs = require('fs')
const { stdin, stdout, stderr, exit } = process
const glob = require('glob')
const chalk = require('chalk')
const path = require('path')
const boxen = require('boxen')

let started

const count = glob.sync(path.join(__dirname, 'slide*.js')).length

readline.emitKeypressEvents(process.stdin)
if (stdin.isTTY) stdin.setRawMode(true)

const hideCursor = () => stderr.write('\x1B[?25l')
const showCursor = () => stdout.write('\x1B[?25h')

let slide = 1

hideCursor()

process.on('exit', showCursor)

stdin.on('keypress', onKeyPress)

let gotoSlide = ''

function onKeyPress (str, key) {
  if (key.name === 'left') {
    show(slide - 1).catch(console.error)
  } else if (key.name === 'right') {
    show(slide + 1).catch(console.error)
  } else if (key.ctrl && key.name === 'c') {
    readline.cursorTo(stdout, 0, stdout.rows - 1)
    console.log(chalk.cyanBright('⚡ presentation ended 🚀'))
    stdin.setRawMode(false)
    exit(0)
  } else if (str === 'r') {
    show(slide).catch(console.error)
  } else if (str === '?') {
    readline.cursorTo(stdout, 0, 0)
    readline.clearScreenDown(stdout)
    showTitle('  ⚡ Help   ')
    stdout.write(chalk`
  {bold.green left}: previous slide

  {bold.green right}: next slide

  {bold.green ?}: show help

  {bold.green <slide number + enter>}: goto slide

  {bold.green r}: refresh current slide

  {bold.green ^C}: exit
  `)
  } else if (/[0-9]/.test(key.name)) {
    gotoSlide += key.name
  } else if (str === '\r') {
    show(Number(gotoSlide)).catch(console.error)
    gotoSlide = ''
  } else {
    gotoSlide = ''
  }
}

show(slide).catch(console.error)

async function show (nextSlide) {
  const slidePath = path.join(__dirname, `slide-${nextSlide}.js`)
  try {
    fs.statSync(slidePath)
  } catch (e) {
    return
  }

  if (!started && nextSlide === 2) {
    started = Date.now()
  }

  progress(nextSlide, count)

  const slideFn = require(slidePath)
  const hasShell = slideFn.toString().match(/await shell/)

  if (hasShell) {
    stdin.pause()
    showCursor()
  } else {
    hideCursor()
  }

  try {
    stdin.removeAllListeners('keypress')
    readline.cursorTo(stdout, 0, 0)
    readline.clearScreenDown(stdout)
    const lines = (await slideFn()).split(/\n/).map(line => line.trim())
    readline.cursorTo(stdout, 0, 0)
    readline.clearScreenDown(stdout)
    lines[1] = boxen(chalk.bold(lines[1]), {
      borderColor: 'cyan',
      borderStyle: 'round',
      padding: { top: 1, bottom: 1, left: 1, right: 2 },
      margin: 0
    })
    stdout.write(
      boxen(lines.join('\n'), {
        padding: { top: 0, bottom: 0, left: 3, right: 3 },
        margin: 3,
        float: 'center',
        borderStyle: 'round',
        dimBorder: true
      })
    )
    progress(nextSlide, count)
    slide = nextSlide
  } finally {
    if (hasShell) {
      stdin.resume()
    }
    hideCursor()
    stdin.on('keypress', onKeyPress)
  }
}

function showTitle (text) {
  stdout.write(
    chalk.bold(
      boxen(text, {
        align: 'center',
        float: 'center',
        padding: { top: 1, right: 1, left: 1, bottom: 1 },
        margin: { top: 0, bottom: 1 },
        borderColor: '#444',
        borderStyle: 'round',
        dimBorder: true
      })
    )
  )
}

function progress (curr, total, scale = 1) {
  readline.cursorTo(stdout, 0, stdout.rows - 1)
  const bars = ['█░']

  let ratio = curr / total
  ratio = Math.min(Math.max(ratio, 0), 1)

  let bar = ` ${curr}/${total} (00:${Math.floor(
    (Date.now() - started || 0) / 60000
  )
    .toString()
    .padStart(2, '0')})`

  const chars = bars[0].split('')
  const availableSpace = Math.max(0, stdout.columns * scale - bar.length - 1)
  const width = Math.min(total, availableSpace)
  const completeLength = Math.round(width * ratio)
  const complete = chars[0].repeat(completeLength)
  const incomplete = chars[1].repeat(width - completeLength)
  bar = `${chalk.green(complete)}${chalk.grey(incomplete)}${bar}`

  const pad = ' '.repeat(stdout.columns / 2 - bar.length / 2)
  stdout.write(pad + bar + pad)
}
