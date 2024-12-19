#!/bin/bash

###############################################################################
# Deploy Postgres and configure it to require mutual TLS for remote connections
# The database server also uses an X509 SVID for its service identity
###############################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
./dbserver/deploy.sh
