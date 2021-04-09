'use strict'

const chalk = require('chalk')
const me = require('./me')

module.exports = async () => chalk`
⚡ Attempting a distributed append-only log in a serverless world

Hi I'm {cyanBright James Kyburz}

${me}
On twitter and github {cyanBright JamesKyburz}

{cyanBright https://github.com/JamesKyburz/dynamodb-logs}

You can run it yourself {bold npm run speakeasyjs} 🙂
`
