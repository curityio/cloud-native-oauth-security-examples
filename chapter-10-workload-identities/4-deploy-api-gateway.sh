#!/bin/bash

##################################################################################
# Deploy the Kong API gateway and add a service mesh sidecar to the gateway pods
# This enables the gateway pods to initiate mTLS connections to upstream workloads
##################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run the shared version and add annotations so that gateway pods get an extra service mesh sidecar
# The extra sidecar enables the gateway to route to upstream components using mTLS
#
export USE_SERVICE_MESH='true'
../resources/apigateway/deploy-api-gateway.sh
