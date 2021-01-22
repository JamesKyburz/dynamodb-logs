#!/usr/bin/env python
# -*- coding: utf-8 -*-

from diagrams import Diagram
from diagrams.aws.integration import Eventbridge
from diagrams.aws.compute import Lambda

graph_attr = {
    "fontsize": "10",
    "bgcolor": "white",
}

with Diagram(
    "EventBridge -> DynamoDB table (dynamodb-logs) reads",
    show=True,
    filename="reads",
    graph_attr=graph_attr,
):
    handler = Lambda("Lambda")
    event_bridge = Eventbridge("EventBridge")
    event_bridge >> handler
