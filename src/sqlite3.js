const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('db')
exports.handler = async function save (event) {
  if (event.detail['replay-name']) {
    console.log(`will not save replay ${event.detail['replay-name']} to db`)
    return
  }
  const {
    time: createdAt,
    detail: { log, type }
  } = event
  await new Promise((resolve, reject) => {
    try {
      db.serialize(() => {
        try {
          db.run(`
      create table if not exists events (createdAt int not null, log text not null, type text not null, event text not null);
      ${['createdAt', 'log', 'type', 'event']
        .map(
          field => `create index if not exists idx_${field} on events(${field})`
        )
        .join(';')}
    `)
          const createEvent = db.prepare(
            'insert into events (createdAt, log, type, event) values (?, ?, ?, ?)'
          )
          createEvent.run([createdAt, log, type, JSON.stringify(event)], err =>
            err ? reject(err) : resolve()
          )
          createEvent.finalize()
        } catch (err) {
          reject(err)
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
