#!/bin/bash

###############################################################
# Run a scripted client to get an access token and call the API
###############################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

RESPONSE_FILE='curlresponse.txt'
rm -f "$RESPONSE_FILE"

#
# Use the client credentials grant to get an opaque access token from the authorization server
#
TEST_CLIENT_SECRET='WU5r7D2MoPHa1lspOph7'
HTTP_STATUS=$(curl -s -k 'https://login.democluster.example/oauth/v2/oauth-token' \
    -H 'content-type: application/x-www-form-urlencoded' \
    -H 'accept: application/json' \
    -d 'client_id=phantom-token-test' \
    -d "client_secret=$TEST_CLIENT_SECRET" \
    -d 'grant_type=client_credentials' \
    -o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "Problem encountered getting an access token, status: $HTTP_STATUS"
  cat "$RESPONSE_FILE"
  exit 1
fi

JSON=$(tail -n 1 $RESPONSE_FILE) 
OPAQUE_ACCESS_TOKEN=$(jq -r .access_token <<< "$JSON")
echo 'Client authenticated and received an opaque access token'

#
# The API gateway translates the opaque token to a JWT, which the API echoes back
#
HTTP_STATUS=$(curl -s -k 'https://api.democluster.example/minimalapi' \
    -H 'content-type: application/json' \
    -H 'accept: application/json' \
    -H "authorization: Bearer $OPAQUE_ACCESS_TOKEN" \
    -o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "Problem encountered calling the API, status: $HTTP_STATUS"
  cat "$RESPONSE_FILE"
  exit 1
fi
JSON="$(cat $RESPONSE_FILE)"
echo "Client successfully called API: $JSON"
