#!/bin/bash

# Install Jest and necessary dependencies for testing
echo "Installing Jest and testing dependencies..."

npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @types/node \
  jest-environment-jsdom

echo "Jest dependencies installed successfully!"
echo "You can now run tests with: npm test"