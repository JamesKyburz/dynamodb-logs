# -*- coding: utf-8 -*-

import boto3
import os
import json
import tempfile

SEQUENCES_PATH = os.path.join(tempfile.gettempdir(), "sequences.json")


def handler(event, context):
    key = event["detail"]["key"]
    pk = key["pk"]
    if os.path.isfile(SEQUENCES_PATH):
        with open(SEQUENCES_PATH) as f:
            sequences = json.load(f)
    else:
        sequences = {}

    if pk in sequences:
        current = sequences[pk]
    else:
        current = "\x00"

    print(event, sequences)

    config = {"api_version": "2012-08-10"}
    if os.getenv("IS_OFFLINE", ""):
        config.update(
            {
                "endpoint_url": "http://127.0.0.1:8000",
                "region_name": "us-east-1",
                "aws_access_key_id": "x",
                "aws_secret_access_key": "x",
            }
        )

    dynamodb = boto3.resource("dynamodb", **config)
    table = dynamodb.Table(os.getenv("DYNAMODB_TABLE"))
    response = table.query(
        KeyConditionExpression="#pk = :pk and #sk > :sk",
        ExpressionAttributeNames={"#pk": "pk", "#sk": "sk"},
        ExpressionAttributeValues={":pk": pk, ":sk": current},
        Limit=1,
    )

    size = len(response["Items"])
    if size > 0:
        items = response["Items"]
        sequences[pk] = items[size - 1]["sk"]
        print(f"next record > {current}")
        print(items)
        with open(SEQUENCES_PATH, "w") as f:
            f.write(json.dumps(sequences))

    else:
        print(f"no new record > {current}")
