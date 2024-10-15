
#!/bin/bash

########################################
# Deploy the API to a local KIND cluster
########################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Load the Docker image into KIND's docker registry
#
echo "Loading API image into the cluster ..."
kind load docker-image zerotrustapi:1.0.0 --name example
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Prepare the namespace
#
kubectl apply -f namespace.yaml

#
# Create the ingress secret in this namespace, so that the API uses the gateway's external TLS certificate
#
kubectl -n applications delete secret external-tls 2>/dev/null
kubectl -n applications create secret tls external-tls \
  --cert=../../resources/apigateway/external-certs/democluster.ssl.pem \
  --key=../../resources/apigateway/external-certs/democluster.ssl.key
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the Kubernetes TLS secret for the API gateway'
  exit 1
fi

#
# Apply YAML resources
#
kubectl -n applications apply -f serviceaccount.yaml
kubectl -n applications apply -f service.yaml
kubectl -n applications apply -f ingress.yaml

#
# The deployment details depend on how the API implements authorization
#
if [ "$AUTHORIZATION_STRATEGY" == 'policy' ]; then
  kubectl -n applications delete -f deployment-policy.yaml 2>/dev/null
  kubectl -n applications apply  -f deployment-policy.yaml
else
  kubectl -n applications delete -f deployment-code.yaml 2>/dev/null
  kubectl -n applications apply  -f deployment-code.yaml
fi
