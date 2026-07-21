#!/bin/bash

set -e

echo "Running npm audit..."
npm audit

echo "Running ESLint..."
npx eslint src tests --ext .ts --fix

echo "Validating CHANGELOG..."
# Normalizes CHANGELOG.md in place and hard-fails on an invalid change type,
# enforcing the standard Added/Changed/Deprecated/Removed/Fixed/Security
# categories (same fix-in-place philosophy as `eslint --fix` above).
npm run changelog

echo "Running tests and coverage"
npx vitest run || { echo "Found issues, exiting"; exit 1; }
echo "No issues runnning tests"

echo ""
node scripts/checkCoverage.js

echo "Generating docs..."
npm run docs -- --treatWarningsAsErrors

echo "Building project..."
npm run build
