const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('db')
exports.handler = async function save (event) {
  if (event.detail['replay-name']) {
    console.log(`will not save replay ${event.detail['replay-name']} to db`)
    return
  }
  db.serialize(() => {
    db.run(`
      create table if not exists events (createdAt int not null, payload text not null);
      create index if not exists eventsCreatedAt on events(eventedAt);
    `)
    const createEvent = db.prepare('insert into events values(?, ?)')
    createEvent.run([event.time, JSON.stringify(event)])
    createEvent.finalize()
  })
}
