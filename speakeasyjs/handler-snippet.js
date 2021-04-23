exports.handler = async function user ({
  detail: {
    type,
    key: { sk, pk },
    payload: { id }
  }
}) {
  // partition key (pk)
  // sort key (sk)
  // id of event
  // type of event
  //...
}
