#!/bin/bash

###############################################################################################
# Install and configure an Istio service mesh, including support for SPIFFE workload identities
###############################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Install the service mesh
#
./base/service-mesh/install.sh
if [ $? -ne 0 ]; then
  exit 1
fi
