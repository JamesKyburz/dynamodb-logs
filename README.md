# dynamodb log

sample repo to use DynamoDB with append only logs.

examples contain either Node.js or Python examples.

![DynamoDB table(dynamodb-logs) writes][writes]

### why?

I previously built [level-eventstore] and wanted the same benefits of append only logs, but using serverless.

By using DynamoDB with [Dynamodb Streams] we can build append only logs.

Although we cannot implement a strict append only log, we can order log items by when they are written.

Using a either a [Universally Unique Lexicographically Sortable Identifier] or a [monotic] value to preserve the item order when reading from DynamoDB.

- Logs are saved in DynamoDB.
- Publish / Subscribe changes using [EventBridge].

### how?

<details>
  <summary>design</summary>

### writing to DynamoDB

example payload written to DynamoDB

```json
{
  "pk": "users#12#stream",
  "sk": "1610121906-rnd",
  "type": "create",
  "log": "users",
  "payload": {
    "id": "12",
    "email": "test@example.com"
  }
}
```

- pk (partition key) is `log name#id#stream`
- sk (sort key) should be a [lexicographic] [monotic] value, our suggestion would be to use [ulid] for the sort key.
- type is the name of the event useful for event handlers.
- log name of log.
- payload should contain the id and optional extra fields.

When items are written to DynamoDB they are written to the DynamoDB stream in the order they are written.

The lambda is then triggered which will publish the changed keys to [EventBridge].

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

### required to run locally in offline mode and for linting

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
virtualenv venv
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
  --item """
  {
    \"pk\": { \"S\": \"users#12#stream\" },
    \"sk\": { \"S\": \"$(date '+%s')\" },
    \"type\": { \"S\": \"create\" },
    \"payload\": { \"M\": {
      \"id\": { \"S\": \"12\"},
      \"email\": { \"S\": \"test@example.com\"}
    }}
  }""" \
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

[writes]: ./diagrams/writes.png
[EventBridge]: https://aws.amazon.com/eventbridge/
[level-eventstore]: https://github.com/JamesKyburz/level-eventstore
[DynamoDB Streams]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html
[Universally Unique Lexicographically Sortable Identifier]: https://github.com/ulid/spec
[monotic]: https://en.wikipedia.org/wiki/Monotonic_function
[lexicographic]: https://en.wikipedia.org/wiki/Lexicographic_order
[ulid]: https://github.com/ulid/spec
