#!/bin/bash

###########################################################################################
# Run a console app client to perform a user login and then call its API with access tokens
###########################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Move to the folder for the console app example
#
cd ../chapter-12-platform-specific-apps/console-app

#
# Ensure that Node.js trusts the authorization server and API certificates
#
export NODE_EXTRA_CA_CERTS='../../resources/apigateway/external-certs/democluster.ca.pem'

#
# Install dependencies if required
#
if [ ! -d 'node_modules' ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo 'Problem encountered installing dependencies'
    exit 1
  fi
fi

#
# Then run the console app and login to the browser using a pre-shipped user account
# The console app then calls APIs with its access token
# - dana / Password1
# - kim / Password1
#
npm start
