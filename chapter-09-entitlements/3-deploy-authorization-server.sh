#!/bin/bash

################################################
# Deploy the authorization server to the cluster
################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run the shared version but override to use opaque access tokens
#
../resources/authorizationserver/deploy-authorization-server.sh
