#!/bin/bash

###############################################################################
# Deploy Postgres and configure it to require mutual TLS for remote connections
# The database server also uses an X509 SVID for its service identity
###############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Create the applications namespace if required
#
kubectl create namespace applications

#
# Build the database server custom docker image and load it into the KIND docker registry
#
docker build -t dbserver:v1 .
if [ $? -ne 0 ]; then
  echo '*** Problem encountered building the database server docker image'
  exit 1
fi

kind load docker-image dbserver:v1 --name example
if [ $? -ne 0 ]; then
  echo '*** Problem encountered loading the database server docker image into the Docker registry'
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
# Deploy the database server pod
#
kubectl -n applications apply -f dbserver.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying the database server'
  exit 1
fi
