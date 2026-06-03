#!/usr/bin/env bash
# Start the reader-app dev server with the correct Node version.
# Usage: ./start.sh   (or:  bash start.sh)
set -e
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd "$(dirname "$0")"
echo "Node: $(node -v)  |  starting Next.js dev server on http://localhost:3000"
exec pnpm dev
