#!/usr/bin/env python
# -*- coding: utf-8 -*-

from diagrams import Diagram
from diagrams.aws.database import DynamodbTable
from diagrams.aws.integration import Eventbridge
from diagrams.aws.analytics import KinesisDataStreams
from diagrams.aws.compute import Lambda

graph_attr = {
    "fontsize": "10",
    "bgcolor": "white",
}

with Diagram(
    "DynamoDB table (dynamodb-logs) writes",
    show=True,
    filename="writes",
    graph_attr=graph_attr,
):
    table = DynamodbTable ("DynamoDB table")
    stream = KinesisDataStreams("DynamoDB Stream")
    trigger = Lambda("Lambda")
    event_bridge = Eventbridge("EventBridge")
    table >> stream >> trigger >> event_bridge
