#!/bin/bash

#############################################################################
# Deploy a pod that you can use to make manual postgres connections with mTLS
#############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
./dbclient/deploy.sh
