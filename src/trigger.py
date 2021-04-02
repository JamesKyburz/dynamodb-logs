# -*- coding: utf-8 -*-

import boto3
import os
import json
import sys

from functools import reduce
from decimal import Decimal


def each_slice(size, iterable):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if len(batch) > 0:
        yield batch


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        return json.JSONEncoder.default(self, obj)


def handler(event, context):
    boto3.resource("dynamodb")
    deserializer = boto3.dynamodb.types.TypeDeserializer()

    def change(sum, item):
        new_image = {
            k: deserializer.deserialize(v)
            for k, v in item["dynamodb"]["NewImage"].items()
        }
        pk = new_image["pk"]
        sk = new_image["sk"]
        if not pk.endswith("#stream"):
            return sum
        log = new_image["log"]
        type = new_image["type"]
        payload = new_image["payload"]
        if not log in sum:
            sum[log] = []
        sum[log].append({"key": {"pk": pk, "sk": sk}, "type": type, "payload": payload})
        return sum

    changes = reduce(
        change,
        filter(
            lambda x: x["eventName"] == "MODIFY" or x["eventName"] == "INSERT",
            event["Records"],
        ),
        {},
    )

    config = {"api_version": "2015-10-07"}
    if os.getenv("IS_OFFLINE", ""):
        config.update(
            {
                "endpoint_url": "http://127.0.0.1:4010",
                "aws_access_key_id": "x",
                "aws_secret_access_key": "x",
                "region_name": "us-east-1",
            }
        )

    client = boto3.client("events", **config)

    def detail(log, item):
        detail_with_payload = json.dumps(
            {
                "log": log,
                "key": item["key"],
                "type": item["type"],
                "payload": item["payload"],
            },
            cls=DecimalEncoder,
        )
        detail_less_payload = json.dumps(
            {
                "log": log,
                "key": item["key"],
                "type": item["type"],
                "partial": true,
                "payload": {"id": item["payload"]["id"]},
            },
            cls=DecimalEncoder,
        )
        if len(detail_with_payload) <= 10240:
            return detail_with_payload
        else:
            return detail_less_payload

    for log, items in changes.items():
        for batch in each_slice(10, items):
            entries = list(
                map(
                    lambda item: {
                        "EventBusName": "dynamodb-log",
                        "Source": "dynamodb-log",
                        "DetailType": "stream changes",
                        "Detail": detail(log, item),
                    },
                    batch,
                )
            )
            print("put_events", entries)
            ret = client.put_events(Entries=entries)
            if "FailedEntryCount" in ret:
                failedCount = ret["FailedEntryCount"]
            else:
                failedCount = 0
            if failedCount > 0:
                raise Exception(
                    "error sending to eventbridge failed {0}".format(failedCount)
                )

    return {}
