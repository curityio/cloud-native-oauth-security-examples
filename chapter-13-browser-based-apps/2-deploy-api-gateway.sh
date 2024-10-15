#!/bin/bash

#########################################################
# Deploy the Kong API gateway with a phantom token plugin
#########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run the shared version
#
../resources/apigateway/deploy-api-gateway.sh