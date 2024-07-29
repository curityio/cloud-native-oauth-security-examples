#!/bin/bash

#################################################################################
# Deploy a minimal API to the Node.js cluster, which simply reflects back the JWT
#################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Build the code
#
./api/deployment/build.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Deploy the API
#
./api/deployment/deploy.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Make the phantom token plugin available to the API
#
kubectl -n applications apply -f ../resources/apigateway/phantom-token-plugin.yaml
