#!/bin/bash

#######################################################
# Deploy backend for frontend components to the cluster
#######################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Generate a cookie encryption key at deployment time and populate yaml files
#
export COOKIE_ENCRYPTION_KEY=$(openssl rand 32 | xxd -p -c 64)
if [ $? -ne 0 ]; then
  echo 'Problem encountered using OpenSSL to create a cookie encryption key'
  exit 1
fi

envsubst < ./backend-for-frontend/oauth-agent/deployment/deployment.yaml     > ./backend-for-frontend/oauth-agent/deployment/deployment-subst.yaml
envsubst < ./backend-for-frontend/api-routes/plugins/oauth-proxy-plugin.yaml > ./backend-for-frontend/api-routes/plugins/oauth-proxy-plugin-subst.yaml
if [ $? -ne 0 ]; then
  echo 'Problem encountered updating yaml files with the cookie encryption key'
  exit 1
fi

#
# Build the code for the BFF OAuth Client (OAuth Agent)
#
./backend-for-frontend/oauth-agent/deployment/build.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API code'
  exit 1
fi

#
# Deploy the BFF OAuth Client's Kubernetes resources
#
./backend-for-frontend/oauth-agent/deployment/deploy.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered deploying the API YAML resources'
  exit 1
fi

#
# Create an ingress route for the orders API and activate plugin configuration
#
kubectl -n applications apply -f backend-for-frontend/api-routes/ordersapi-route.yaml
kubectl -n applications apply -f backend-for-frontend/api-routes/plugins/cors-plugin.yaml
kubectl -n applications apply -f backend-for-frontend/api-routes/plugins/oauth-proxy-plugin-subst.yaml
kubectl -n applications apply -f ../resources/apigateway/phantom-token-plugin.yaml

#
# Create an ingress route for the OpenID Connect userinfo endpoint and activate plugin configuration
#
kubectl -n authorizationserver apply -f backend-for-frontend/api-routes/oauthuserinfo-route.yaml
kubectl -n authorizationserver apply -f backend-for-frontend/api-routes/plugins/cors-plugin.yaml
kubectl -n authorizationserver apply -f backend-for-frontend/api-routes/plugins/oauth-proxy-plugin-subst.yaml
