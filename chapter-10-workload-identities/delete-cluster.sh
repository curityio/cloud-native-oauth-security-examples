#!/bin/bash

###########################################################
# This deletes the entire cluster and any related resources
###########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Delete the cluster
#
echo 'Deleting KIND cluster ...'
kind delete cluster --name='example'

#
# Also clean up the Docker based proxy used by cloud-provider-kind
#
echo 'Stopping external load balancer ...'
LOADBALANCER=$(docker ps | grep envoyproxy | awk '{print $1}')
if [ "$LOADBALANCER" != '' ]; then
  docker kill $LOADBALANCER 2>/dev/null
fi