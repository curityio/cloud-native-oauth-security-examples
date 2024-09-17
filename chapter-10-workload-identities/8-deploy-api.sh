#!/bin/bash

##############################################################################
# Deploy a demo API that uses JDBC to connect to Postgres using X509 SVIDs
##############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
./demoapi/deploy.sh
