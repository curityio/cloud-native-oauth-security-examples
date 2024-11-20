#!/bin/bash

############################################################################
# Deploy cert-manager which is used as the upstream root authority for SPIRE
############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Start clean if retrying the deployment
#
kubectl delete namespace cert-manager 2>/dev/null

#
# Install cert-manager resources
#
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.1/cert-manager.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered getting cert-manager resources'
  exit 1
fi

#
# Wait for services to be ready, and allow a grace period to prevent validating web hook errors
#
echo 'Waiting for cert-manager pods to come up ...'
kubectl wait pod --for=condition=ready -n cert-manager -l app=cert-manager
sleep 30

#
# Create the root CA
#
kubectl -n cert-manager apply -f rootca.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the cert-manager root CA'
  exit 1
fi
