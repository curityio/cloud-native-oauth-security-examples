#!/bin/bash

###################################################################################
# Install the Istio service mesh, in a setup where SPIRE issues workload identities
###################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Start clean if retrying the deployment
#
kubectl delete namespace istio-system 2>/dev/null

#
# Get the Helm repo
#
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
ISTIO_VERSION='1.24.1'

#
# Install the Istio base system with custom resource definitions
#
echo 'Installing Istio base system ...'
helm upgrade --install istio-base istio/base -n istio-system --create-namespace --version $ISTIO_VERSION
if [ $? -ne 0 ]; then
  echo '*** Problem encountered Istio base system'
  exit 1
fi

#
# Install istiod, which manages sidecar injection and issuing of workload identities when using service mesh mTLS
#
echo 'Installing a customized istiod that integrates with SPIRE ...'
helm upgrade --install istiod istio/istiod -n istio-system --values=istiod-helm-values.yaml --version $ISTIO_VERSION
if [ $? -ne 0 ]; then
  echo '*** Problem encountered running the istiod Helm chart'
  exit 1
fi

sleep 5
echo 'Waiting for istiod pods to come up ...'
kubectl wait pod --for=condition=ready -n istio-system -l app=istiod
