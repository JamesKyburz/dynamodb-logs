# -*- coding: utf-8 -*-

import boto3
import os
import json
import tempfile

SEQUENCES_PATH = os.path.join(tempfile.gettempdir(), "sequences.json")


def handler(event, context):
    pk = event["detail"]["pk"]
    if os.path.isfile(SEQUENCES_PATH):
        with open(SEQUENCES_PATH) as f:
            sequences = json.load(f)
    else:
        sequences = {}
    if pk in sequences:
        sk = sequences[pk]
    else:
        sk = "\x00"
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
        ExpressionAttributeValues={":pk": pk, ":sk": sk},
    )

    size = len(response["Items"])
    if size > 0:
        items = response["Items"]
        sequences[pk] = items[size - 1]["sk"]
        print(json.dumps(items, indent=2))
        with open(SEQUENCES_PATH, "w") as f:
            f.write(json.dumps(sequences))

    else:
        print(f"no new records after {sk}")
    print("sequences", sequences)
