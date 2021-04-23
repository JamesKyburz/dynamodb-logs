const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('db')

exports.handler = async function save (event) {
  const { 'replay-name': replayName } = event
  if (replayName) {
    console.log(`will not save replay ${replayName} to db`)
    return
  }
  // ...
  const {
    time: createdAt,
    detail: { log, type }
  } = event
  // ...
  const createEvent = db.prepare(
    'insert into events (createdAt, log, type, event) values (?, ?, ?, ?)'
  )
}
