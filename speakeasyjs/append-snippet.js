function append (sequences) {
  return function * (req, res) {
    const event = yield req.json({ log: false })
    // ...
    const currentStreamVersion = yield cb => streams.head(log + id, cb)
    const streamKey = streams.key(log + id, currentStreamVersion + 1)
    const logKey = logs.key(log, ++sequences[log])
    const rows = [
      { key: streamKey, value: sequences[log] },
      { key: logKey, value: event }
    ]
    res.setNextErrorMessage('key is write-locked')
    yield cb => batch(db, rows, cb)
    res.json({ id })
  }
}
