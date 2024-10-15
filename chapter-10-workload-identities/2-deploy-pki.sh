#!/bin/bash

##################################################################################################
# Install and configure SPIRE to enable a public key infrastructure for workload identity issuance
##################################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Use cert-manager to issue a root certificate for SPIRE
#
./base/pki/certmanager/install.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Install SPIRE to enable issuance of workload identities
#
./base/pki/spire/install.sh
if [ $? -ne 0 ]; then
  exit 1
fi
