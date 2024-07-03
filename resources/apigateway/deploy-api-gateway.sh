#!/bin/bash

################################################################
# Deploy a customized Kong ingress controller as the API gateway
################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ "$CLUSTER_NAME" == '' ]; then
  echo 'A CLUSTER_NAME environment variable must be set before running this script'
  exit 1
fi

#
# Create the namespace
#
kubectl delete namespace kong 2>/dev/null
kubectl create namespace kong

#
# Build the custom docker image with plugin dependencies
#
docker build --no-cache -t custom-kong:1.0.0 .
if [ $? -ne 0 ]; then
  echo 'Problem building the custom Kong docker image'
  exit 1
fi

#
# Load the docker image into the KIND registry
#
kind load docker-image custom-kong:1.0.0 --name $CLUSTER_NAME
if [ $? -ne 0 ]; then
  echo 'Problem loading the custom Kong docker image into the KIND registry'
  exit 1
fi

#
# Create configmaps containing LUA plugins
#
kubectl -n kong create configmap curity-phantom-token --from-file='curity-phantom-token/'
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the phantom token configmap'
  exit 1
fi

#
# Run the Helm chart, which references the configmap
#
helm repo add kong https://charts.konghq.com 1>/dev/null
helm repo update
helm install kong kong/kong --values helm-values.yaml --namespace kong
if [ $? -ne 0 ]; then
  echo 'Problem encountered running the Kong API gateway Helm chart'
  exit 1
fi

#
# Wait for Kong to come up
#
echo 'Waiting for the Kong ingress controller to come up ...'
sleep 5
kubectl wait --namespace kong \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=app \
  --timeout=90s

#
# Report the external IP address
#
CLUSTER_IP=$(kubectl -n kong get svc kong-kong-proxy -o jsonpath="{.status.loadBalancer.ingress[0].ip}")
echo "The cluster's external IP address is $CLUSTER_IP ..."
