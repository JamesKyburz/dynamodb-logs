#!/usr/bin/env bash

set -euo pipefail

export AWS_ACCESS_KEY_ID=x
export AWS_SECRET_ACCESS_KEY=x
export AWS_REGION=us-east-1

npx dynamodb-query-cli --endpoint http://localhost:8000
