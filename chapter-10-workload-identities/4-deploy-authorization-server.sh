#!/bin/bash

####################################################################################
# This deploys the Curity Identity Server as the cloud native authorization server
# If preferred, an alternative system could be deployed here to fulfil the same role
####################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run an advanced install that includes secret protection
#
./base/authorizationserver/install.sh