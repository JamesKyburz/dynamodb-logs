exports.handler = async function user (event) {
  const {
    detail: {
      key: { sk, pk },
      payload: { id }
    }
  } = event
  //...
}
