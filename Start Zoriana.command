#!/bin/zsh
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:$PATH"
if [ ! -d node_modules ]; then npm install || exit 1; fi
node server.mjs
