# -*- coding: utf-8 -*-

from __future__ import print_function
import json
import boto3
from functools import reduce


def handler(event, context):
    def record(sum, record):
        if not record["entity"] in sum:
            sum[record["entity"]] = []
        sum[record["entity"]].append(record)
        return sum

    boto3.resource("dynamodb")
    deserializer = boto3.dynamodb.types.TypeDeserializer()
    records = reduce(
        record,
        map(
            lambda x: {k: deserializer.deserialize(v) for k, v in x.items()},
            map(
                lambda x: x["dynamodb"]["NewImage"],
                filter(
                    lambda x: x["eventName"] == "MODIFY" or x["eventName"] == "INSERT",
                    event["Records"],
                ),
            ),
        ),
        {},
    )
    if "stream-tail" in records:
        print(sorted(records["stream-tail"], key=lambda x: x["sk"]))

    if "stream" in records:
        print(sorted(records["stream"], key=lambda x: x["sk"]))

    return {}
