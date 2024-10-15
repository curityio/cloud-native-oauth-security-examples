#!/bin/bash

##############################################################################
# Build the OAuth Agent to a Docker image that is loaded into the KIND cluster
##############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

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
echo 'Building the OAuth Agent (BFF OAuth client) ...'
npm run build
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the Node.js code'
  exit 1
fi

#
# Build a custom Docker image to deploy the OAuth Agent
#
echo 'Building the OAuth Agent docker image ...'
docker build --no-cache -f Dockerfile -t oauth-agent:1.0.0 ../
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the OAuth Agent docker image'
  exit 1
fi

#
# Load the Docker image into KIND's docker registry
#
echo "Loading OAuth Agent image into the cluster ..."
kind load docker-image oauth-agent:1.0.0 --name example
if [ $? -ne 0 ]; then
  exit 1
fi
