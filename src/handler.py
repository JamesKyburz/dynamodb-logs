# -*- coding: utf-8 -*-

import boto3
import os


def handler(event, context):
    print("I am here")
    print(event)
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

    print("table", type(client.Table("dynamodb-log")))
    return {}
