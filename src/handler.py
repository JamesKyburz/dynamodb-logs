# -*- coding: utf-8 -*-

import boto3
import os
import json


def handler(event, context):
    pk = event["detail"]["pk"]
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

    client = boto3.client("dynamodb", **config)
    response = client.query(
        TableName=os.getenv("DYNAMODB_TABLE"),
        KeyConditionExpression="#pk = :pk and #sk > :sk",
        ExpressionAttributeNames={"#pk": "pk", "#sk": "sk"},
        ExpressionAttributeValues={":pk": {"S": pk}, ":sk": {"S": sk}},
    )

    print(json.dumps(response["Items"], indent=2))

    return {}
