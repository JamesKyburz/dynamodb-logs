# -*- coding: utf-8 -*-

import boto3
import os
import json
import sys
from functools import reduce


def each_slice(size, iterable):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if len(batch) > 0:
        yield batch


def handler(event, context):
    def change(sum, item):
        keys = item["dynamodb"]["Keys"]
        pk = keys["pk"]["S"]
        sk = keys["sk"]["S"]
        if not pk.endswith("#stream"):
            return sum
        log = pk.split("#")[0]
        if not log in sum:
            sum[log] = []
        sum[log].append({"key": {"pk": pk, "sk": sk}})
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

    for log, items in changes.items():
        for batch in each_slice(10, items):
            entries = list(
                map(
                    lambda item: {
                        "EventBusName": "dynamodb-log",
                        "Source": "dynamodb-log",
                        "DetailType": "stream changes",
                        "Detail": json.dumps({"log": log, "key": item["key"]}),
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
