'use strict'

const shell = require('./shell')
const path = require('path')

module.exports = async file => {
  const result = await shell(
    `/usr/bin/batcat --tabs=2 --color=always --style=snip --pager=0 ${file} || cat ${file}`
  )
  return result.stdout
}
