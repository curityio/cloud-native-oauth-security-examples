#!/bin/bash

############################################################################
# Deploy the example API to the cluster, which the SPA routes to via its BFF
############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Build the API's code
#
../chapter-05-secure-api-development/deployment/build.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API code'
  exit 1
fi

#
# Deploy the API's Kubernetes resources
#
../chapter-05-secure-api-development/deployment/deploy.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered deploying the API YAML resources'
  exit 1
fi