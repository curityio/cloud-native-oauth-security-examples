#!/bin/bash

###########################################################################################
# Run a console app client to perform a user login and then call its API with access tokens
###########################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../chapter-13-native-apps/console-app

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
# - bob / Password1
# - alice / Password1
#
npm start
