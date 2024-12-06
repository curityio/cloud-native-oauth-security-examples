#!/bin/bash

####################################################################################
# Create a KIND cluster and run a load balancer in the same manner as a cloud system
####################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run the shared version
#
../resources/base/create-cluster.sh
