#!/bin/bash
set -e

npm run build --workspace=shared
npm run build --workspace=web
npm run prisma:generate --workspace=server
npm run build --workspace=server

# Keep the Node deployment self-contained and expose the Vite output in the
# location Vercel serves as static files.
rm -rf server/dist/public public
cp -R web/dist server/dist/public
cp -R web/dist public

echo "✓ Build complete"
