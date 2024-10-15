#!/bin/bash

#############################################################################
# Deploy a debug pod that uses its workload identity as a database credential
#############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Create the applications namespace if required
#
kubectl create namespace applications

#
# Build the main Docker image, which is used to manually call the database server
#
docker build -t dbclient:v1 .
if [ $? -ne 0 ]; then
  echo '*** Problem encountered building the dbclient docker image'
  exit 1
fi

kind load docker-image dbclient:v1 --name example
if [ $? -ne 0 ]; then
  echo '*** Problem encountered loading the dbclient image into the Docker registry'
  exit 1
fi

#
# Build the SPIFFE helper sidecar container
#
./spiffe-helper-sidecar/build.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Deploy the database client pod and its sidecar
#
kubectl -n applications apply -f dbclient.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying the dbclient pod'
  exit 1
fi
