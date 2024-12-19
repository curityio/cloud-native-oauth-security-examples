#!/bin/bash

#############################
# Deploy the Kong API gateway with a 
#############################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run the shared version and add annotations so that gateway pods get an extra service mesh sidecar
# The extra sidecar enables the gateway to route to upstream components using mTLS
#
export USE_SERVICE_MESH='true'
../resources/apigateway/deploy-api-gateway.sh
