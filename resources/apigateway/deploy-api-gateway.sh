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
# Add a label to the API gateway namespace to satisfy the network policy
#
kubectl label namespace kong name=kong

#
# Pull the latest Docker image to ensure no issues with old versions and LUA install dependencies
#
docker pull kong/kong:3.9-ubuntu
if [ $? -ne 0 ]; then
  echo 'Problem pulling the custom Kong docker image'
  exit 1
fi

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
# Install custom resource definitions for the gateway API
#
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.1.0/standard-install.yaml
if [ $? -ne 0 ]; then
  echo 'Problem encountered installing the Kong Gateway API resource definitions'
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
# Create external SSL certificates if required
#
./external-certs/create.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating external certificates for the API gateway'
  exit 1
fi

#
# Produce the final Helm values file and activate service mesh settings if required
#
if [ "$USE_SERVICE_MESH" == 'true' ]; then
  export SERVICE_MESH_SETTINGS="$(cat ./service-mesh-settings.yaml)"
else
  export SERVICE_MESH_SETTINGS=''
fi
envsubst < helm-values-template.yaml > helm-values.yaml 
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the final gateway Helm values file'
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
# Create a secret for the external certificate and key
#
kubectl -n kong create secret tls external-tls \
  --cert=./external-certs/democluster.ssl.pem \
  --key=./external-certs/democluster.ssl.key
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the Kubernetes TLS secret for the API gateway'
  exit 1
fi

#
# Create base Kubernernetes gateway API resources
#
kubectl -n kong apply -f gateway.yaml
if [ $? -ne 0 ]; then
  echo 'Problem encountered deploying gateway resources'
  exit 1
fi

#
# Report the external IP address
#
CLUSTER_IP=$(kubectl -n kong get svc kong-kong-proxy -o jsonpath="{.status.loadBalancer.ingress[0].ip}")
echo "The cluster's external IP address is $CLUSTER_IP ..."
