#!/bin/bash

####################################################################################
# Create a KIND cluster and run a load balancer in the same manner as a cloud system
####################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# First install the KIND cluster
#
kind delete cluster --name=example 2>/dev/null
kind create cluster --name=example --config='cluster.yaml'
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the KIND cluster'
  exit 1
fi

#
# Then run a development load balancer
#
../loadbalancer/run-load-balancer.sh
if [ $? -ne 0 ]; then
  exit 1
fi
