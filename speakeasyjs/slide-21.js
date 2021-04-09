'use strict'

const chalk = require('chalk')
const shell = require('./shell')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ AWS Deploy

${await shell('asciinema play -i 3 -s 2 iamlive.cast', {
  stdio: 'inherit'
}).then(
  f => '',
  () =>
    chalk`open {cyanBright https://asciinema.org/a/406170} in a browser to see iamlive demo`
)}

${await shell('asciinema play -i 3 -s 2 aws.cast', {
  stdio: 'inherit'
}).then(
  f => '',
  () =>
    chalk`open {cyanBright https://asciinema.org/a/406167} in browser to see aws demo`
)}
`
