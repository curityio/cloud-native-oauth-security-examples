#!/bin/bash

###############################################################################################
# Deploy a pod that uses a strong Kubernetes client credential to call the authorization server
###############################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Create the applications namespace if required
#
kubectl create namespace applications

#
# Build a utility Docker image, that will use its SPIFFE workload identity as a credential
#
docker build -t oauthclient:v1 .
if [ $? -ne 0 ]; then
  echo '*** Problem encountered building the oauthclient docker image'
  exit 1
fi

#
# Load it into the KIND docker registry
#
kind load docker-image oauthclient:v1 --name example
if [ $? -ne 0 ]; then
  echo '*** Problem encountered loading the oauthclient image into the Docker registry'
  exit 1
fi

#
# Deploy the oauthclient pod
#
kubectl -n applications apply -f oauthclient.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying the oauthclient pod'
  exit 1
fi
