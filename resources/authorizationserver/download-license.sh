#!/bin/bash

#######################################################################################
# A utility to download a community edition license file for the Curity Identity Server
#######################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

LICENSE_FILE_PATH="$(pwd)/license.json"

#
# Return 1 (true) if the user needs to download a license file
#
function needsLicenseDownload() {

  if [ ! -f "$LICENSE_FILE_PATH" ]; then
    echo 1
    return
  fi

  CURRENT_DATE="$(date +%F)"
  EXPIRES_DATE="$(cat $LICENSE_FILE_PATH | jq -r .Expires)"
  if [[ "$CURRENT_DATE" > "$EXPIRES_DATE" ]]; then
    echo 1
    return
  fi

  echo 0
}

#
# Download the license tool, which is a go CLI that runs a code flow
#
function getLicenseToolDownloadFileName() {

  if [ "$(uname -m)" == 'arm64' ]; then
    ARCH='arm64'
  else
    ARCH='amd64'
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
    echo "curity-license-tool-${PLATFORM}-${ARCH}.tar.gz"
}

#
# First check that the jq tool, used to read the license file, is installed
#
jq --version 1>/dev/null
if [ $? -ne 0 ]; then
  echo 'Please install the jq tool'
  exit 1
fi

#
# Do nothing if there is already a valid license file on disk
#
if [ $(needsLicenseDownload) == 0 ]; then
  exit 0
fi

#
# Inform the user who will see a browser window, but not every time they run a deployment
#
echo 'This script gets a community edition license for the Curity Identity Server.'
echo 'A CLI will run a code flow in the system browser to get an access token with which to download the license.'
echo 'Press a key to continue ...'
read -n 1

#
# Download the license tool if required
#
DOWNLOAD_FILENAME="$(getLicenseToolDownloadFileName)"
if [ ! -f $DOWNLOAD_FILENAME ]; then

  echo 'copying'
  cp ../../../book-license-cli/curity-book-cli .
  
  #curl -s -L -O "https://github.com/curityio/curity-license-tool/releases/1.0.0/$DOWNLOAD_FILENAME"
  #if [ $? -ne 0 ]; then
  #  echo 'Problem encountered downloading the license file utility'
  #  exit 1
  #fi
fi

#
# Unzip the executable
#
#tar -zxf $DOWNLOAD_FILENAME
#if [ $? -ne 0 ]; then
#  echo '*** Problem encountered unpacking the license tool'
#  exit 1
#fi

#
# Execute the license tool to run a code flow and wait for the response
# 
./curity-book-cli
if [ $? -ne 0 ]; then
  echo 'Problem encountered running a code flow with the Curity license tool'
  exit 1
fi

#
# Check that there is now a valid license on disk
#
if [ ! -f "$LICENSE_FILE_PATH" ]; then
  echo 'The license file download did not complete successfully'
  exit 1
fi
