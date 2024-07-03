#!/bin/bash

#########################################################
# Build the minimal API and load it into the KIND cluster
#########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ "$CLUSTER_NAME" == '' ]; then
  echo 'A CLUSTER_NAME environment variable must be set before running this script'
  exit 1
fi

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
echo "Loading API image into the $CLUSTER_NAME cluster ..."
kind load docker-image minimalapi:1.0.0 --name $CLUSTER_NAME
if [ $? -ne 0 ]; then
  exit 1
fi
