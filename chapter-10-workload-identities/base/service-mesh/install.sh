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
ISTIO_VERSION='1.23.3'

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

#
# Install the Istio API gateway, to enable ingress traffic and to route to workloads using mTLS
#
echo 'Installing a customized Istio API gateway that integrates with SPIRE ...'
helm upgrade --install istio-ingressgateway istio/gateway -n istio-system --values=gateway-helm-values.yaml --version $ISTIO_VERSION
if [ $? -ne 0 ]; then
  echo '*** Problem encountered running the Istio API gateway Helm chart'
  exit 1
fi

#
# Wait for the gateway to become available
#
sleep 5
echo 'Waiting for the Istio API gateway to come up ...'
kubectl wait pod --for=condition=ready -n istio-system -l app=istio-ingressgateway

#
# Reuse the default API gateway's certificate creation script
#
echo 'Configuring the Istio API gateway ...'
../../../resources/apigateway/external-certs/create.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered creating external certificates for the API gateway'
  exit 1
fi

#
# Save the external certificate and key to a Kubernetes secret
#
kubectl -n istio-system create secret tls external-tls \
  --cert=../../../resources/apigateway/external-certs/democluster.ssl.pem \
  --key=../../../resources/apigateway/external-certs/democluster.ssl.key
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the Kubernetes TLS secret for the API gateway'
  exit 1
fi

#
# Configure a default gateway to use external HTTPS
#
kubectl -n istio-system apply -f ./gateway.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the Istio default gateway'
  exit 1
fi

#
# Finally, report the API gateway's external IP address
#
EXTERNAL_IP_ADDRESS=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath="{.status.loadBalancer.ingress[0].ip}")
echo "The cluster's external IP address is $EXTERNAL_IP_ADDRESS ..."
