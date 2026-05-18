#!/bin/bash

set -e

echo "Running ESLint..."
eslint src --ext .ts --fix

echo "Converting files to CRLF line endings..."
find src -type f -name "*.ts" | while read file; do
    unix2dos "$file" 2>/dev/null
done

echo "Building project..."
npm run build
