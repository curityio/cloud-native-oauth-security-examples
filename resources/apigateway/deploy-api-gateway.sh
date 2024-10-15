#!/bin/bash

################################################################
# Deploy a customized Kong ingress controller as the API gateway
################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

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
kind load docker-image custom-kong:1.0.0 --name example
if [ $? -ne 0 ]; then
  echo 'Problem loading the custom Kong docker image into the KIND registry'
  exit 1
fi

#
# Create configmaps containing LUA scripts
#
kubectl -n kong create configmap curity-phantom-token --from-file='curity-phantom-token/'
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the phantom token configmap'
  exit 1
fi

kubectl -n kong create configmap curity-oauth-proxy --from-file='curity-oauth-proxy/'
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the oauth-proxy configmap'
  exit 1
fi

#
# Create external SSL certificates in case needed
#
./external-certs/create.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating external certificates for the API gateway'
  exit 1
fi

#
# Create a secret for the external certificate and key, to match the name in the Helm values file
#
kubectl -n kong create secret tls external-tls \
  --cert=./external-certs/democluster.ssl.pem \
  --key=./external-certs/democluster.ssl.key
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the Kubernetes TLS secret for the API gateway'
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
