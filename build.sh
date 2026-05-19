#!/bin/bash

set -e

echo "Running ESLint..."
npx eslint src tests --ext .ts --fix

echo "Running tests and coverage"
npx vitest run || { echo "Found issues, exiting"; exit 1; }
echo "Tests look good"

COVERAGE=$(sed -nE 's/.*<span class="strong">([0-9.]+).*/\1/p' coverage/index.html 2>/dev/null | head -1)
echo "Coverage at: ${COVERAGE}%"

COVERAGE_INT=${COVERAGE%%.*}
[ "$COVERAGE_INT" -ge 95 ] || { echo "❌ Coverage below 95% threshold, exiting"; exit 1; }
echo "✅ Coverage meets 95% threshold"

echo "Building project..."
npm run build
