#!/bin/bash

####################################################################
# Build SPIFFE helper into a container that is deployed as a sidecar
# This implementation downloads both X509 SVIDs and JWT SVIDs
####################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Download SPIFFE helper
#
DOWNLOAD_FILE='spiffe-helper-v0.8.0.tar.gz'
curl -s -L "https://github.com/spiffe/spiffe-helper/releases/download/v0.8.0/$DOWNLOAD_FILE" > $DOWNLOAD_FILE
if [ $? -ne 0 ]; then
  echo '*** Problem encountered downloading the spiffe-helper Linux executable'
  exit 1
fi

tar -xzf "$DOWNLOAD_FILE"
rm "$DOWNLOAD_FILE" 2>/dev/null
chmod +x ./spiffe-helper

#
# Build the sidecar Docker image
#
docker build -t dbclient-spiffehelper:v1 .
if [ $? -ne 0 ]; then
  echo '*** Problem encountered building the SPIFFE helper docker image'
  exit 1
fi

kind load docker-image dbclient-spiffehelper:v1 --name example
if [ $? -ne 0 ]; then
  echo '*** Problem encountered loading the SPIFFE helper image into the Docker registry'
  exit 1
fi

#
# Create a configmap for this component's SPIFFE helper configuration
#
kubectl -n applications delete configmap dbclient-spiffehelper-config 2>/dev/null
kubectl -n applications create configmap dbclient-spiffehelper-config --from-file='./helper.conf'
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the SPIFFE helper configmap for the dbclient'
  exit 1
fi
