#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Tear down the mobile deployment
#
export AUTHORIZATION_SERVER_BASE_URL=''
export DEEP_LINKING_BASE_URL=''
docker compose --profile 'mobile' down

#
# Also tear down any internet SSL URLs used by mobile apps
#
for tunnel in `pgrep tmole`; do
  kill -9 $tunnel
done
