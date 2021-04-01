#!/usr/bin/env bash

set -ueo pipefail

#shellcheck disable=SC2001
files=$(echo "$*" | sed "s;$(pwd);/work;g")

if [[ -n "${files:-}" ]]; then
  docker run \
    --rm \
    -i \
    -v "$(pwd)":/work \
    -w /work \
    jameskyburz/ops-kitchen bash -c "black ${files:?}"
fi
