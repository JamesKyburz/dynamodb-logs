#!/usr/bin/env bash

set -euo pipefail

export AWS_ACCESS_KEY_ID=x
export AWS_SECRET_ACCESS_KEY=x

npx dynamodb-query-cli --endpoint http://localhost:8000
