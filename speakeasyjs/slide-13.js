'use strict'

const chalk = require('chalk')
const shell = require('./shell')
const cat = require('./cat')

module.exports = async () => chalk`
⚡ AWS Lambda config

${await shell('asciinema play -i 3 -s 2 offline.cast', {
  stdio: 'inherit'
}).then(
  f => '',
  () =>
    chalk`open {cyanBright https://asciinema.org/a/406173} in a browser to see offline demo`
)}

${await cat('./serverless-functions-snippet.yml')}
`
