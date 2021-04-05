const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('db')
exports.handler = async function save (event) {
  if (event.detail['replay-name']) {
    console.log(`will not save replay ${event.detail['replay-name']} to db`)
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
