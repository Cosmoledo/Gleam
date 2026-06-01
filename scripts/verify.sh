#!/bin/bash

set -e

echo "Running ESLint..."
npx eslint src tests --ext .ts --fix

echo "Running tests and coverage"
npx vitest run || { echo "Found issues, exiting"; exit 1; }
echo "No issues runnning tests"

echo ""
node scripts/checkCoverage.js

echo "Building project..."
npm run build
