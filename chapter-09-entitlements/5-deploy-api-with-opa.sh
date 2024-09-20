#!/bin/bash

#######################################
# Deploy the example API to the cluster
#######################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../chapter-05-secure-api-development

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
export AUTHORIZATION_STRATEGY='policy'
../chapter-05-secure-api-development/deployment/deploy.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered deploying the API YAML resources'
  exit 1
fi

#
# Make the phantom token plugin available to the API
#
kubectl -n applications apply -f ../resources/apigateway/phantom-token-plugin.yaml
