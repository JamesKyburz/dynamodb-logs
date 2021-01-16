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
        sum[log].append(pk)
        return sum

    changes = reduce(
        change,
        filter(
            lambda x: x["eventName"] == "MODIFY" or x["eventName"] == "INSERT",
            event["Records"],
        ),
        {},
    )

    print(changes)

    config = {"api_version": "2015-10-07"}
    if os.getenv("PYTHON_ENV", "") == "local":
        config["endpoint_url"] = "http://127.0.0.1:4010"

    client = boto3.client("events", **config)

    for log, keys in changes.items():
        for batch in each_slice(10, keys):
            ret = client.put_events(
                Entries=list(
                    map(
                        lambda pk: {
                            "EventBusName": "dynamodb-log",
                            "Source": "dynamodb-log",
                            "DetailType": "stream changes",
                            "Detail": json.dumps({"log": "log", "pk": pk}),
                        },
                        batch,
                    )
                ),
            )
            if "FailedEntryCount" in ret:
                failedCount = ret["FailedEntryCount"]
            else:
                failedCount = 0
            if failedCount > 0:
                raise Exception(
                    "error sending to eventbridge failed {0}".format(failedCount)
                )

    return {}
