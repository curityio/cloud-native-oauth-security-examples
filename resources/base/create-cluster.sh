#!/bin/bash

####################################################################################
# Create a KIND cluster and run a load balancer in the same manner as a cloud system
####################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ "$CLUSTER_NAME" == '' ]; then
  echo 'A CLUSTER_NAME environment variable must be set before running this script'
  exit 1
fi

#
# First install the KIND cluster
#
kind delete cluster --name=$CLUSTER_NAME 2>/dev/null
kind create cluster --name=$CLUSTER_NAME --config='cluster.yaml'
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
