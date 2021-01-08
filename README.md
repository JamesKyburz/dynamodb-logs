# dynamodb logs

sample repo to use dynamodb with append only logs using both Node.js and Python examples.

![Process dynamodb-logs writes][diagram]

### why?

I previously built [level-eventstore](https://github.com/JamesKyburz/level-eventstore) and wanted the same benefits of append only logs, but using serverless.

By using DynamoDB with [Dynamodb Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) we can build append only logs.

Although we cannot implement a strict append only log, we can order log items by when they are written.

We can also use [Atomic Counters](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.AtomicCounters) to make sure each log item has a unique log sequence number.

- Logs are saved in DynamoDB.
- Publish / Subscribe changes using [EventBridge](https://aws.amazon.com/eventbridge/).

### how?

<details>
  <summary>design</summary>

### writing to DynamoDB

example payload written to DynamoDB

```json
{
  "pk": "users#12#stream#tail",
  "sk": "1610121906-rnd",
  "type": "create",
  "log": "users",
  "entity": "stream-tail",
  "payload": {
    "id": "12",
    "name": "test"
  }
}
```

- pk (partition key) is `log name#id#stream#tail`
- sk (sort key) should be an ever increasing lexicographic value
  suggestion would be to use [ulid](https://github.com/ulid/spec) for the sort key
- type is the name of the event useful for event handlers
- log name of log
- payload must contain the id and optional extra fields
- entity must be `stream-tail`

When items are written to DynamoDB they are written to the DynamoDB stream in the order they are written.

The lambda is then triggered which will read these `stream-tail` log items and will write back to the DynamoDB table a new item with entity `stream` and a log sequence number which an atomic counter for each log

### lambda triggers

- [Node.js lambda trigger](./src/trigger.js)
- [Python lambda trigger](./src/trigger.py)

### event handlers triggered by EventBridge

- [Node.js event handler example](./src/handler.js)
- [Python event handler example](./src/handler.py)

</details>

### setup

<details>
  <summary>install prerequisites</summary>

### only required if using python

- [python 3.8.6](https://www.python.org/downloads/release/python-386)
- [virtualenv](https://virtualenv.pypa.io/en/latest/installation.html)

### only required to run locally in offline mode

- [docker](https://www.docker.io)
- [docker-compose](https://docs.docker.com/compose)

### required (serverless framework and tools)

- [nodejs](https://nodejs.org)

</details>

<details>
  <summary>in AWS</summary>

export AWS credentials before running `cli.sh`

### Node.js

```sh
npm i
./cli.sh
npx sls -c serverless-node.yml deploy
```

### Python

```sh
npm i
./cli.sh
rm -rf venv
virtualenv venv venv
. venv/bin/activate
pip3 install -r requirements.txt
npx sls -c serverless-python.yml deploy
rm -rf venv
```

Query DynamoDB

```sh
./cli.sh
npx dynamodb-query-cli \
  --region us-east-1
```

</details>

<details>
  <summary>locally</summary>

```sh
docker-compose up -d
npx sls --stage=local -c dynamodb.local.yml dynamodb migrate
```

### Node.js

```sh
npx sls --stage=local -c serverless-node.yml offline start
```

### Python

```sh
virtualenv venv venv
. venv/bin/activate
pip3 install -r requirements.txt
npx sls --stage=local -c serverless-python.yml offline start
```

Add item using aws cli

```sh
./cli.sh
export AWS_ACCESS_KEY_ID=x
export AWS_SECRET_ACCESS_KEY=x
export AWS_DEFAULT_REGION=us-east-1
aws dynamodb put-item \
  --table-name local-dynamodb-logs \
  --item "{\"pk\": { \"S\": \"users#12#stream#tail\" }, \"sk\": { \"S\": \"$(date '+%s')\" }, \"entity\": { \"S\": \"stream-tail\" }, \"ttl\": { \"N\": \"$(date '+%s' -d '+4 days')\" }}" \
  --endpoint http://localhost:8000
```

Query DynamoDB

```sh
./cli.sh
npx dynamodb-query-cli \
  --region us-east-1 \
  --endpoint http://localhost:8000
```

```sh
docker-compose down
```

</details>

# license

[Apache License, Version 2.0](LICENSE)

[diagram]: ./diagrams/dynamodb.png
