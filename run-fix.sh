#!/bin/bash

echo "Starting approval system fix script..."

# Install necessary packages if they're not already installed
npm install --no-save better-sqlite3 nanoid

# Run the fix script
node fix-approvals.js

echo "Fix script completed. Starting the development server..."
echo "Test login with pm1@demo.com / password"

# Start the development server
npm run dev