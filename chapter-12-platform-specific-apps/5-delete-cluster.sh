#!/bin/bash

############################
# Tear down the KIND cluster
############################

cd "$(dirname "${BASH_SOURCE[0]}")"

kind delete cluster --name='example'
