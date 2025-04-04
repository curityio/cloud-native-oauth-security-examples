#!/bin/bash

############################################
# Deploy a cloud native authorization server
############################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# First download a license for the Curity Identity Server
#
../../../resources/authorizationserver/license/download-license.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Get the license key
#
LICENSE_FILE_PATH='../../../resources/authorizationserver/license/license-override.json'
if [ ! -f "$LICENSE_FILE_PATH" ]; then
  LICENSE_FILE_PATH='../../../resources/authorizationserver/license/license.json'
fi

#
# The download tool produces a license.json file or the user can copy in a license-override.json
#
export LICENSE_KEY="$(cat $LICENSE_FILE_PATH | jq -r .License)"
if [ "$LICENSE_KEY" == '' ]; then
  echo '*** An invalid license file was provided for the Curity Identity Server'
  exit 1
fi

#
# For simplicity the example deployment recreates all resources every time
#
kubectl delete namespace authorizationserver 2>/dev/null
kubectl create namespace authorizationserver
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the authorizationserver namespace'
  exit 1
fi

#
# Prepare a parameterized configuration that protects secure values
#
./protect-secrets.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Create a configmap for the database schema of the authorization server
#
kubectl -n authorizationserver create configmap postgres-configmap --from-file='resources/postgres-schema.sql'
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the postgres config map'
  exit 1
fi

#
# Deploy the database server
#
kubectl -n authorizationserver apply -f resources/postgres.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying the postgres database'
  exit 1
fi

#
# Create a configmap for the authorization server's configuration
#
kubectl -n authorizationserver create configmap idsvr-configbackup \
  --from-file='config-backup=resources/config-backup.xml'
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the XML configuration configmap'
  exit 1
fi

#
# Create service accounts
#
kubectl -n authorizationserver apply -f ./resources/service-accounts.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating service accounts for the Curity Identity Server'
  exit 1
fi

#
# Run the Helm Chart to deploy the system
#
helm repo add curity https://curityio.github.io/idsvr-helm
helm repo update
helm uninstall curity --namespace authorizationserver 2>/dev/null
helm upgrade --install curity curity/idsvr --values=resources/helm-values.yaml --namespace authorizationserver
if [ $? -ne 0 ]; then
  echo '*** Problem encountered running the Helm Chart'
  exit 1
fi

#
# Require mTLS for connections to the Curity Identity Server
#
kubectl -n authorizationserver apply -f ./resources/mtls.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered enabling mTLS'
  exit 1
fi

#
# Create the Istio ingress for the admin and runtime endpoints
#
kubectl -n authorizationserver apply -f ./resources/ingress.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the Istio ingress'
  exit 1
fi

#
# Enable the authorization server to call the Kubernetes JWKS URI so that it can validate service account tokens
#
kubectl apply -f ./resources/cluster-security.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered granting access to the Kubernetes JWKS URI'
  exit 1
fi
