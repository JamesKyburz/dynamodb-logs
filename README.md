# dynamodb log

sample repo to use DynamoDB with append only logs.

examples contain either Node.js or Python.

DynamoDB write triggers

![DynamoDB table(dynamodb-logs) writes][writes]

EventBridge reads

![EventBridge DynamoDB table (dynamodb-logs) reads][reads]

### why?

I previously built [level-eventstore] and wanted the same benefits of append only logs, but using serverless.

By using DynamoDB with [DynamoDB Streams] we can build append only logs.
Although we cannot implement a strict append only log we can order log items by when they are written, and with conditional writes we can perform optimistic locking.

We can preserve the item order when reading from DynamoDB using a sort key.

- Logs are saved in DynamoDB.
- Publish / Subscribe changes using [EventBridge].

### license

[Apache License, Version 2.0](LICENSE)


<details>
  <summary>design</summary>

### writing to DynamoDB

example payload written to DynamoDB

```json
{
  "pk": "users#12#stream",
  "sk": 1,
  "type": "create",
  "log": "users",
  "payload": {
    "id": "12",
    "email": "test@example.com"
  }
}
```

- pk (partition key) is `log name#id#stream`.
- sk (sort key).
- type is the name of the event useful for event handlers.
- log name of log.
- payload should contain the id and any optional extra fields.

When items are written to DynamoDB they are written to the DynamoDB stream for the shard they belong to in the order they are written.

The lambda is then triggered which will publish the changed keys to [EventBridge].

### example lambda triggers

- [Node.js lambda trigger](./src/trigger.js)
- [Python lambda trigger](./src/trigger.py)

### example event handlers triggered by EventBridge

- [Node.js event handler example](./src/handler.js)
- [Python event handler example](./src/handler.py)

</details>

<details>
  <summary>install prerequisites</summary>

### only required if using python

- [python 3.8.6](https://www.python.org/downloads/release/python-386)
- [virtualenv](https://virtualenv.pypa.io/en/latest/installation.html)

### required to run locally in offline mode and for linting

- [docker](https://www.docker.io)
- [docker-compose](https://docs.docker.com/compose)

### required (serverless framework and tools)

- [nodejs 14](https://nodejs.org)

</details>

<details>
  <summary>in AWS</summary>

export AWS credentials before running `cli.sh`

### Node.js deploy to AWS

```sh
npm i
./cli.sh
npx sls -c serverless-node.yml --stage dev deploy
```

### Node.js remove stack in AWS

```sh
npm i
./cli.sh
npx sls -c serverless-node.yml --stage dev remove
```

### Python deploy to AWS

```sh
npm i
./cli.sh
rm -rf venv
virtualenv venv
. venv/bin/activate
pip3 install -r requirements.txt
npx sls -c serverless-python.yml --stage dev deploy
rm -rf venv
```

### Python remove stack in AWS

```sh
npm i
./cli.sh
npx sls -c serverless-python.yml --stage dev remove
```

Query DynamoDB

```sh
./cli.sh
export AWS_DEFAULT_REGION=us-east-1
npx dynamodb-query-cli \
  --region us-east-1
```

</details>

<details>
  <summary>offline</summary>

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
virtualenv venv
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
    \"sk\": { \"N\": \"${sk:-1}\" },
    \"type\": { \"S\": \"create\" },
    \"log\": { \"S\": \"users\" },
    \"payload\": { \"M\": {
      \"id\": { \"S\": \"12\"},
      \"email\": { \"S\": \"test@example.com\"}
    }}
  }""" \
  --condition-expression "attribute_not_exists(pk)" \
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

<details>
  <summary>retries offline and in AWS</summary>

### offline retries

per stack retry limit is configurable using the [offline eventbridge plugin].

```yaml
custom:
  serverless-offline-aws-eventbridge:
    retryDelayMs: 1000
    maximumRetryAttempts: 5
```

### destinations

using onFailure failures can be handled by your application.

failure payloads look like this

```yaml
  eventHandler:
    handler: src/handler.handler
    destinations:
      onFailure: retry
    iamRoleStatements:
      - Effect: Allow
        Action:
          - "lambda:InvokeFunction"
        Resource:
          - !Sub "arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:dynamodb-logs-${opt:stage}-retry"
```

```json
{
    "version": "1.0",
    "timestamp": "<timestamp>",
    "requestContext": {
        "requestId": "<uuid>",
        "functionArn": "arn:...",
        "condition": "RetriesExhausted",
        "approximateInvokeCount": 3
    },
    "requestPayload": {
        "version": "0",
        "id": "<uuid>",
        "detail-type": "stream changes",
        "source": "dynamodb-log",
        "account": "<account>",
        "time": "<timestamp>",
        "region": "<region>",
        "resources": [],
        "detail": {
            "log": "<log>",
            "key": {
                "pk": "<pk>",
                "sk": 0
            },
            "type": "<create>",
            "payload": {
                "id": "<id>"
            }
        }
    },
    "responseContext": {
        "statusCode": 200,
        "executedVersion": "$LATEST",
        "functionError": "Unhandled"
    },
    "responsePayload": {
        "errorType": "Error",
        "errorMessage": "<error message>",
        "trace": []
    }
}
```

</details>

<details>
  <summary>replay using EventBridge archive</summary>

  When run offline events are persisted to sqlite3 file `./db`.

  Events can be replayed to EventBridge or DynamoDB, you can also replay events from AWS to local which will deplay an extra stack using a websocket lambda and a new event target that writes to the connected websockets.

  ```sh
  ./cli.sh
  ./run-archive.js
  ```
</details>

[writes]: ./diagrams/writes.png
[reads]: ./diagrams/reads.png
[eventbridge]: https://aws.amazon.com/eventbridge/
[offline eventbridge plugin]: https://github.com/rubenkaiser/serverless-offline-eventBridge
[level-eventstore]: https://github.com/JamesKyburz/level-eventstore
[dynamodb streams]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html
