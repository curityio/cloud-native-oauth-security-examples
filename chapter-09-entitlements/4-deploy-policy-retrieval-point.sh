#!/bin/bash

################################################
# Deploy the server that hosts the policy bundle
################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Prepare namespace
#
kubectl apply -f ../chapter-05-secure-api-development/deployment/namespace.yaml

#
# Produce the bundle file from the latest rego
#
cd policy-retrieval-point

#
# Build the policy bundle
#
echo 'Building the OPA policy bundle ...'
opa build -b policy/ -o orders_bundle.tar.gz
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the policy bundle'
  exit 1
fi

#
# Replace configmap
#
echo 'Creating a configmap to deploy the OPA policy bundle ...'
kubectl -n applications create configmap orders-policy-bundle \
  --from-file ./orders_bundle.tar.gz \
  -o yaml \
  --save-config \
  --dry-run=client | kubectl -n applications apply -f - 
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the configmap for the policy bundle'
  exit 1
fi

#
# Deploy the server that serves the policy bundle (for dynamic updates of policies)
#
kubectl -n applications delete configmap orders-policy-bundle --ignore-not-found=true
kubectl -n applications create configmap orders-policy-bundle --from-file ./orders_bundle.tar.gz
kubectl -n applications apply -f ./deployment.yaml -f ./service.yaml
