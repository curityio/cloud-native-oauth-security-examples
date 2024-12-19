#!/bin/bash

######################################################################
# Build the API to a Docker image that is loaded into the KIND cluster
######################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ..

#
# Install dependencies if required
#
if [ ! -d 'node_modules' ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo 'Problem encountered installing dependencies'
    exit 1
  fi
fi

#
# Build TypeScript code to JavaScript
#
echo 'Building the zero trust API ...'
npm run build
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the Node.js code'
  exit 1
fi

#
# Build a custom Docker image to deploy the API
#
echo 'Building the zero trust API docker image ...'
docker build --no-cache -f deployment/Dockerfile -t zerotrustapi:1.0.0 .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API docker image'
  exit 1
fi
