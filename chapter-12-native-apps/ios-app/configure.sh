#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ "$APPLE_TEAM_ID" == '' ]; then
  echo 'Please set an APPLE_TEAM_ID environment variable before running the app'
  exit 1
fi

#
# Set dynamic values in the configuration
#
envsubst < ./templates/config.json > ./config.json
if [ $? -ne 0 ]; then
  echo 'Problem encountered configuring the iOS mobile app'
  exit
fi

#
# Set the deep linking host name in the iOS entitlements file
#
export DEEP_LINKING_HOST_NAME="${DEEP_LINKING_BASE_URL:8}"
envsubst < ./templates/DemoApp.entitlements > ./DemoApp.entitlements
if [ $? -ne 0 ]; then
  echo 'Problem encountered configuring iOS entitlements'
  exit
fi

#
# Write the Apple Team ID to the iOS deep linking assets file
# Deep linking registration will take place when the app is run from Xcode
#
envsubst < ../assets/templates/apple-app-site-association > ../assets/.well-known/apple-app-site-association
if [ $? -ne 0 ]; then
  echo 'Problem encountered running the envsubst command to create assetlinks.json'
  exit
fi
