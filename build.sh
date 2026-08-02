#!/bin/bash
set -e
npm run build --workspace=shared
npm run build --workspace=server
if [ -d "web/dist" ]; then
  rm -rf server/dist/public
  cp -r web/dist server/dist/public
fi
echo "✓ Build complete"
