# -*- coding: utf-8 -*-

import boto3
import json
import os

from pprint import pprint
from decimal import Decimal


def handler(event, context):
    key = event["detail"]["key"]
    pk = key["pk"]
    sk = key["sk"]
    if "payload" in event:
        id = event["payload"]["id"]
    else:
        id = None

    pprint({"products handler": event, "pk": pk, "sk": sk})

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
    products_table = dynamodb.Table(os.getenv("DYNAMODB_PRODUCTS_TABLE"))
    logs_table = dynamodb.Table(os.getenv("DYNAMODB_LOGS_TABLE"))

    if id:
        user_pk = f"users#{id}"
    else:
        user_pk = "#".join(pk.split("#")[0:-1])

    products_response = products_table.get_item(
        Key={"pk": user_pk, "sk": user_pk},
        ConsistentRead=True,
        ExpressionAttributeNames={"#version": "version"},
        ProjectionExpression="#version",
    )

    if "Item" in products_response and "version" in products_response["Item"]:
        current_version = products_response["Item"]["version"]
    else:
        current_version = Decimal(0)

    print(f"CURRENT VERSION {str(current_version)}")

    logs_response = logs_table.query(
        KeyConditionExpression="#pk = :pk and #sk > :sk",
        ExpressionAttributeNames={"#pk": "pk", "#sk": "sk"},
        ExpressionAttributeValues={":pk": pk, ":sk": current_version},
    )

    if "Items" in logs_response:
        for event in logs_response["Items"]:
            if event["sk"] < current_version:
                print(
                    f"current version is higher, will ignore {pk} {event['sk']} < {current_version}"
                )
                return {}
            handler = get_event_handler(products_table, user_pk, event)
            if handler:
                handler(event)
            else:
                print(f"no event handler found for type {event['type']}")

    return {}


def get_event_handler(products_table, pk, event):
    type = event["type"]
    id = event["payload"]["id"]
    sk = pk

    def signup(event):
        payload = event["payload"]
        name = payload["name"]
        email = payload["email"]
        version = event["sk"]

        products_table.put_item(
            Item={
                "pk": pk,
                "sk": sk,
                "type": "user",
                "id": id,
                "name": name,
                "email": email,
                "version": version,
            },
            ConditionExpression="attribute_not_exists(pk)",
            ReturnValues="NONE",
        )

    def add_phone_number(event):
        payload = event["payload"]
        phoneNumber = payload["phoneNumber"]
        version = event["sk"]
        products_table.update_item(
            ExpressionAttributeNames={
                "#phoneNumber": "phoneNumber",
                "#version": "version",
            },
            ExpressionAttributeValues={
                ":phoneNumber": phoneNumber,
                ":version": version,
                ":currentVersion": version - 1,
            },
            Key={"pk": pk, "sk": sk},
            UpdateExpression="SET #phoneNumber = :phoneNumber, #version = :version",
            ConditionExpression="#version = :currentVersion",
            ReturnValues="NONE",
        )

    def verify_phone_number(event):
        version = event["sk"]
        products_table.update_item(
            ExpressionAttributeNames={
                "#verifiedPhoneNumber": "verifiedPhoneNumber",
                "#version": "version",
            },
            ExpressionAttributeValues={
                ":verifiedPhoneNumber": True,
                ":version": version,
                ":currentVersion": version - 1,
            },
            Key={"pk": pk, "sk": sk},
            UpdateExpression="SET #verifiedPhoneNumber = :verifiedPhoneNumber, #version = :version",
            ConditionExpression="#version = :currentVersion",
            ReturnValues="NONE",
        )

    def add_location(event):
        version = event["sk"]
        payload = event["payload"]
        long_ = payload["long"]
        lat = payload["lat"]
        products_table.update_item(
            ExpressionAttributeNames={"#location": "location", "#version": "version"},
            ExpressionAttributeValues={
                ":location": {"long": long_, "lat": lat},
                ":version": version,
                ":currentVersion": version - 1,
            },
            Key={"pk": pk, "sk": sk},
            UpdateExpression="SET #location = :location, #version = :version",
            ConditionExpression="#version = :currentVersion",
            ReturnValues="NONE",
        )

    if type == "signup":
        return signup
    elif type == "addPhoneNumber":
        return add_phone_number
    elif type == "verifyPhoneNumber":
        return verify_phone_number
    elif type == "addLocation":
        return add_location
