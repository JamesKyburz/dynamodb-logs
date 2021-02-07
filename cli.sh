#!/usr/bin/env bash

set -euo pipefail

touch .bash_history

docker run \
  --rm \
  -ti \
  -e "AWS_ACCESS_KEY_ID" \
  -e "AWS_SECRET_ACCESS_KEY" \
  -e "AWS_SESSION_TOKEN" \
  -e "AWS_CSM_ENABLED=true" \
  -e "AWS_CSM_PORT=31000" \
  -e "AWS_CSM_HOST=127.0.0.1" \
  -v "$(pwd)":/work \
  -v "$(pwd)/.bash_history:/root/.bash_history" \
  -w /work \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jameskyburz/ops-kitchen bash
