#!/bin/bash

################################################
# Deploy the authorization server to the cluster
################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# First download a license for the Curity Identity Server
#
./license/download-license.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# The download tool produces a license.json file or the user can copy in a license-override.json
#
LICENSE_FILE_PATH="$(pwd)/license/license-override.json"
if [ ! -f "$LICENSE_FILE_PATH" ]; then
  LICENSE_FILE_PATH="$(pwd)/license/license.json"
fi

#
# Get the license key
#
LICENSE_KEY="$(cat $LICENSE_FILE_PATH | jq -r .License)"
if [ "$LICENSE_KEY" == '' ]; then
  echo '*** Unable to find a valid license for the Curity Identity Server'
  exit 1
fi

#
# Create the namespace
#
kubectl delete namespace authorizationserver 2>/dev/null
kubectl create namespace authorizationserver

#
# Deploy a Postgres database used by the authorization server
# 
kubectl -n authorizationserver create configmap postgres-configmap --from-file='data-backup.sql'
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the postgres configmap'
  exit 1
fi

kubectl -n authorizationserver apply -f postgres.yaml
if [ $? -ne 0 ]; then
  echo 'Problem encountered deploying postgres YAML resources'
  exit 1
fi

#
# Use backed up configuration for the authorization server, which uses a fixed encryption key referenced in the helm values file
#
kubectl -n authorizationserver create configmap idsvr-configbackup --from-file='configbackup=config-backup.xml'
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the authorizationserver configmap'
  exit 1
fi

#
# Also create a configmap with runtime environment variables
#
kubectl -n authorizationserver create configmap idsvr-config-properties \
  --from-literal="LICENSE_KEY=$LICENSE_KEY" \
  --from-literal="RUNTIME_BASE_URL=https://login.democluster.example" \
  --from-literal="ADMIN_BASE_URL=https://admin.democluster.example"
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating the authorizationserver secret'
  exit 1
fi

#
# Create the ingress for the login and admin hostnames
#
kubectl -n authorizationserver apply -f ingress.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating authorization server ingress resources'
  exit 1
fi

#
# Deploy the authorization server using its Helm chart
#
helm repo add curity https://curityio.github.io/idsvr-helm
helm repo update
helm install curity curity/idsvr --values='helm-values.yaml' --namespace authorizationserver
if [ $? -ne 0 ]; then
  echo 'Problem encountered running the authorization server Helm chart'
  exit 1
fi
