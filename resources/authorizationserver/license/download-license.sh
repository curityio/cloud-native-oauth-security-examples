#!/bin/bash

#######################################################################################
# A utility to download a community edition license file for the Curity Identity Server
#######################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

LICENSE_FILE_PATH='./license.json'
CLI_VERSION='1.0.0'

#
# Return 1 (true) if the user has no license file or it is expired
#
function requiresLicenseDownload() {

  if [ ! -f "$LICENSE_FILE_PATH" ]; then
    echo 1
    return
  fi

  #VALID_LICENSE=$(cat $LICENSE_FILE_PATH | jq 'has("License")')
  #if [ "$VALID_LICENSE" != 'true' ]; then
  #  rm "$LICENSE_FILE_PATH"
  #  echo 1
  #  return
  #fi

  echo 0
}

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
# First check that the jq tool, used to read the license file, is installed
#
jq --version 1>/dev/null
if [ $? -ne 0 ]; then
  echo 'Please install the jq tool'
  exit 1
fi

#
# Don't run the CLI if the user has copied in a license file
#
if [ -f "$LICENSE_FILE_PATH" ]; then
  exit 0
fi

#
# Inform the user the first time they deploy the Curity Identity Server that a code flow will run
#
if [ $(requiresLicenseDownload) == 0 ]; then
  echo 'This script gets a community edition license for the Curity Identity Server.'
  echo 'A CLI will run a code flow in the system browser to get an access token with which to download the license.'
  echo 'Press a key to continue ...'
  read -n 1
fi

DOWNLOAD_FILENAME="$(getLicenseToolDownloadFileName)"
if [ ! -f "$DOWNLOAD_FILENAME" ]; then

  #
  # Download the executable
  #
  DOWNLOAD_BASE_URL="https://github.com/curityio/book-license-cli/releases/download/$CLI_VERSION"
  curl -s -L -O "$DOWNLOAD_BASE_URL/$DOWNLOAD_FILENAME"
  if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading the license file utility'
    exit 1
  fi

  #
  # Unzip the executable
  #
  unzip -o "$DOWNLOAD_FILENAME"
  if [ $? -ne 0 ]; then
    echo '*** Problem encountered unpacking the license tool'
    exit 1
  fi
fi

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
if [ $(requiresLicenseDownload) == 1 ]; then
  echo 'The license file download did not complete successfully'
  exit 1
fi
