#!/bin/bash

##########################################################
# Configure a customized SPIRE according to the Istio docs
# https://istio.io/latest/docs/ops/integrations/spire
##########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Start clean if retrying the deployment
#
kubectl delete namespace spire-server 2>/dev/null
kubectl create namespace spire-server

#
# Get the Helm repo and view chart versions with 'helm search repo spire'
#
helm repo add spire https://spiffe.github.io/helm-charts-hardened/
helm repo update

#
# Install SPIRE custom resource definitions
#
helm upgrade --install -n spire-server spire-crds spire-crds --repo https://spiffe.github.io/helm-charts-hardened/ --create-namespace --version 0.5.0
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying SPIRE custom resource definitions'
  exit 1
fi

#
# Install SPIRE components with settings in the values file that enable Istio integration
#
helm upgrade --install -n spire-server spire spire --repo https://spiffe.github.io/helm-charts-hardened/ --values=helm-values.yaml --version 0.24.1
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying SPIRE custom resource definitions'
  exit 1
fi

#
# Wait for services to be ready
#
echo 'Waiting for SPIRE pods to come up ...'
kubectl wait pod --for=condition=ready -n spire-server -l statefulset.kubernetes.io/pod-name=spire-server-0 --timeout 180s
kubectl wait pod --for=condition=ready -n spire-server -l app.kubernetes.io/name=agent --timeout 180s
