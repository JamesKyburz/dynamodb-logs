#!/usr/bin/env bash

function clear-prompt() {
  local ps1='\033[92mᐅ \033[0m'
  export PS1="${ps1:?}"
}

trap '' exit int

alias ll='ls -lh'

ps1="\033[96m\$PWD \h \033[35m\033[35m(${COMMIT_ID::-35}) \033[92mᐅ \033[0m"
export PS1="${ps1:?}"

if [[ -z "${__INTERACTIVE:-}" ]]; then
  ./run-cli.js
  exit
fi
