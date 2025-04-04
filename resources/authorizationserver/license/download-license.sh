#!/bin/bash

#####################################################################
# A utility to download a license file for the Curity Identity Server
#####################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

CLI_VERSION='1.0.1'

#
# Get the filename of the license tool, which is a CLI that runs a code flow
#
function getLicenseToolDownloadFileName() {

  if [ "$(uname -m)" == 'arm64' ]; then
    ARCH='arm'
  else
    ARCH='x86'
  fi

  case "$(uname -s)" in

    Darwin)
      PLATFORM='darwin'
    ;;

    MINGW64*)
      PLATFORM='windows'
    ;;

    Linux)
      PLATFORM='linux'
    ;;
    esac
    echo "curity-book-cli-${CLI_VERSION}-${PLATFORM}-${ARCH}.zip"
}

#
# Don't run the CLI if the user has manually copied in a license file
# For example, an override might be used in a corporate environment that blocks the EXE
#
if [ -f ./license-override.json ]; then
  exit 0
fi

#
# Inform the user before running the CLI for the first time
#
if [ ! -f ./license.json ]; then
  echo 'This script gets a community edition license file for the Curity Identity Server.'
  echo 'A CLI will run a code flow in the system browser to get an access token with which to download the license.'
  echo 'Press a key to continue ...'
  read -s -n 1
fi  

#
# Get the CLI executable if required
#
if [ ! -f ./curity-book-cli ]; then

  echo 'Downloading the license file CLI ...'
  DOWNLOAD_FILENAME="$(getLicenseToolDownloadFileName)"
  DOWNLOAD_BASE_URL="https://github.com/curityio/book-license-cli/releases/download/$CLI_VERSION"
  HTTP_STATUS=$(curl -s -L -O "$DOWNLOAD_BASE_URL/$DOWNLOAD_FILENAME" -w '%{http_code}')
  if [ "$HTTP_STATUS" != '200' ]; then
    echo "Problem encountered downloading the license file CLI, status: $HTTP_STATUS"
    exit 1
  fi

  unzip -o "$DOWNLOAD_FILENAME"
  if [ $? -ne 0 ]; then
    echo '*** Problem encountered unpacking the license tool'
    exit 1
  fi
fi

#
# Execute the CLI to run a code flow and wait for the response
# 
./curity-book-cli
if [ $? -ne 0 ]; then
  echo 'Problem encountered running a code flow with the Curity license tool'
  exit 1
fi
