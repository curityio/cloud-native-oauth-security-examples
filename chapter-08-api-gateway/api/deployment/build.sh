#!/bin/bash

#########################################################
# Build the minimal API and load it into the KIND cluster
#########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Build the Docker image
#
cd ..
docker build -f deployment/Dockerfile -t minimalapi:1.0.0 .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API docker image'
  exit 1
fi

#
# Load it into the KIND cluster
#
echo "Loading API image into the cluster ..."
kind load docker-image minimalapi:1.0.0 --name example
if [ $? -ne 0 ]; then
  exit 1
fi
