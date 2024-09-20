#!/bin/bash

################################################
# Apply YAML resources to deploy the minimal API
################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Create the namespace
#
kubectl delete namespace applications 2>/dev/null
kubectl create namespace applications

#
# Apply YAML resources
#
kubectl -n applications apply -f api.yaml
kubectl -n applications apply -f ingress.yaml
