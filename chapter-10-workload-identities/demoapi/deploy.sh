#!/bin/bash

##############################################################################
# Deploy a demo API that uses JDBC to connect to Postgres using X509 SVIDs
##############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Create the applications namespace if required
#
kubectl create namespace applications

#
# Build the API code into a JAR file
#
./gradlew shadowJar --warning-mode all
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Build the API Docker file
#
docker build -t demoapi:v1 .
if [ $? -ne 0 ]; then
  echo '*** Problem encountered building the demo API docker image'
  exit 1
fi

#
# Load it into the KIND docker registry
#
kind load docker-image demoapi:v1 --name example
if [ $? -ne 0 ]; then
  echo '*** Problem encountered loading the API into the KIND docker registry'
  exit 1
fi

#
# Deploy the API by applying its YAML resources
#
kubectl -n applications apply -f demoapi.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying the demoapi resources'
  exit 1
fi
