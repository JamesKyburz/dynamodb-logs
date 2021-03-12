# -*- coding: utf-8 -*-

import boto3
import os
import json
import tempfile
from pprint import pprint
from decimal import Decimal


def handler(event, context):
    key = event["detail"]["key"]
    pk = key["pk"]
    sk = key["sk"]
    sequence_path = os.path.join(tempfile.gettempdir(), f"sequences-{pk}.txt")
    if os.path.isfile(sequence_path):
        with open(sequence_path) as f:
            current = Decimal(f.read())
    else:
        current = Decimal(0)

    pprint({"event": event, "current": current})

    if sk < current + 1:
        return

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

    items = response["Items"]

    if len(items) == 1:
        print(f"next record > {current}")
        print(items)
        with open(sequence_path, "w") as f:
            f.write(str(items[0]["sk"]))
    else:
        print(f"no new record > {current}")

    return {}
