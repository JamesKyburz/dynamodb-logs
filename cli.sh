#!/usr/bin/env bash

set -euo pipefail

log_error() { echo -e "\033[0m\033[1;91m${*}\033[0m"; }
log_info() { echo -e "\033[0m\033[1;94m${*}\033[0m"; }

function cli() {
  local running
  local branch
  local commit_id
  local hash

  touch .bash_history
  mkdir -p .home
  cp .bashrc .home/

  if [[ -f /.dockerenv ]]; then
    if [[ "${1:-}" == "stop" ]]; then
      docker-compose down
      exit 0
    else
      log_error "You are already in docker :)"
      return
    fi
  fi

  running=$(docker ps -q --filter 'name=dynamodb-logs-cli')

  branch=$(git rev-parse --abbrev-ref HEAD | sed 's/[^a-z0-9]/-/g')
  hash=$(git rev-parse HEAD)
  commit_id="${branch:?}"-"${hash:?}"
  if [[ "${1:-}" == "stop" ]]; then
    log_info "stopping containers"
    if [[ -n "${running:-}" ]]; then
      docker kill "${running:?}"
    fi
    docker-compose down
    return
  fi

  if [[ -n "${running:-}" ]]; then
    log_info "docker exec to ${running:?}"
    docker exec -ti "${running:?}" bash
  else
    export MSYS_NO_PATHCONV=1

    docker run \
      --rm \
      -ti \
      -e "AWS_ACCESS_KEY_ID" \
      -e "AWS_SECRET_ACCESS_KEY" \
      -e "AWS_SESSION_TOKEN" \
      -e "AWS_DEFAULT_REGION=us-east-1" \
      -e "AWS_REGION=us-east-1" \
      -e "AWS_CSM_ENABLED=true" \
      -e "AWS_CSM_PORT=31000" \
      -e "AWS_CSM_HOST=127.0.0.1" \
      -e "SLS_DEBUG" \
      -e "COMMIT_ID=${commit_id:?}" \
      -e "HOME=/work/.home" \
      -e "COMPOSE_PROJECT_NAME=dynamodb-logs" \
      -v "$(pwd)":/work \
      -v "$(pwd)/.bash_history:/root/.bash_history" \
      -v "$(pwd)/.bashrc:/root/.bashrc" \
      -w /work \
      --network host \
      --name "dynamodb-logs-cli" \
      -v /var/run/docker.sock:/var/run/docker.sock \
      jameskyburz/ops-kitchen bash
  fi
}

cli "${1:-}"
