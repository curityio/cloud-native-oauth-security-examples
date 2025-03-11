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
# Do nothing if there is already a valid license file on disk
#
if [ $(needsLicenseDownload) == 0 ]; then
  exit 0
fi

#
# First check that the jq tool, used to read the license file, is installed
#
jq --version 2>/dev/null
if [ $? -ne 0 ]; then
  echo 'Please install the jq tool'
  exit 1
fi

#
# Inform the user, who can use their development or work email to get a community edition license
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

  curl -s -L -O "https://github.com/curityio/curity-license-tool/releases/1.0.0/$DOWNLOAD_FILENAME"
  if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading the license file utility'
    exit 1
  fi
fi

#
# Unzip the executable
#
tar -zxf $DOWNLOAD_FILENAME
if [ $? -ne 0 ]; then
  echo '*** Problem encountered unpacking the license tool'
  exit 1
fi

#
# Execute the license tool to run a code flow and give it the folder to which the tool should save the license file
# 
./curity-license-tool "$(pwd)"
if [ $? -ne 0 ]; then
  echo 'Problem encountered running a code flow with the license tool'
  exit 1
fi

#
# Make a final check for success, to handle conditions like cancellation
#
if [ $(needsLicenseDownload) == 1 ]; then
  echo 'The license file download did not complete successfully'
  exit 1
fi
