#!/bin/bash

###############################################################################################
# Deploy a pod that uses a strong Kubernetes client credential to call the authorization server
###############################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
./oauthclient/deploy.sh
