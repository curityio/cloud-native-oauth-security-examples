
#!/bin/bash

################################################
# Deploy the OAuth Agent to a local KIND cluster
################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Then apply yaml resources
#
kubectl -n applications apply -f serviceaccount.yaml
kubectl -n applications apply -f service.yaml
kubectl -n applications apply -f ingress.yaml
kubectl -n applications apply -f deployment-subst.yaml
