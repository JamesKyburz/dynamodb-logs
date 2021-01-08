#!/usr/bin/env python
# -*- coding: utf-8 -*-

from diagrams import Diagram
from diagrams.aws.database import Dynamodb
from diagrams.aws.integration import Eventbridge
from diagrams.aws.analytics import KinesisDataStreams
from diagrams.aws.compute import Lambda

graph_attr = {
    "fontsize": "10",
    "bgcolor": "transparent",
}

with Diagram(
    "Process dynamodb-logs writes",
    show=True,
    filename="dynamodb",
    graph_attr=graph_attr,
):
    table = Dynamodb("(pk, sk)")
    stream = KinesisDataStreams("stream shard")
    trigger = Lambda("trigger")
    gsi = Dynamodb("(logKey, logSeq)")
    event_bridge = Eventbridge("event bridge")
    table >> stream >> trigger >> gsi
    trigger >> event_bridge
    trigger >> stream
