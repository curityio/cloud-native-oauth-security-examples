#!/bin/bash

############################################################################
# Create external ingress certificates for a development cluster
# In a real setup you would use real certificates, such as from Lets Encrypt
############################################################################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Point to the OpenSSL configuration file
#
case "$(uname -s)" in

  Darwin)
    export OPENSSL_CONF='/System/Library/OpenSSL/openssl.cnf'
 	;;

  Linux)
    export OPENSSL_CONF='/usr/lib/ssl/openssl.cnf';
 	;;

  MINGW64*)
    export OPENSSL_CONF='C:/Program Files/Git/usr/ssl/openssl.cnf';
    export MSYS_NO_PATHCONV=1;
	;;
esac

#
# Return if already created, to prevent the need to reconfigure trust on every deployment
#
if [ -f democluster.ssl.pem ]; then
  exit 0
fi

#
# Require up to date OpenSSL
#
OPENSSL_VERSION_3=$(openssl version | grep 'OpenSSL 3')
if [ "$OPENSSL_VERSION_3" == '' ]; then
  echo 'Please install openssl version 3 or higher before running this script'
fi

#
# Configure certificate names
#
ROOT_CERT_FILE_PREFIX='democluster.ca'
ROOT_CERT_DESCRIPTION='External Root CA for democluster.example'
SSL_CERT_FILE_PREFIX='democluster.ssl'
SSL_CERT_PASSWORD='Password1'
WILDCARD_DOMAIN_NAME='*.democluster.example'

#
# Create a root CA for external certificates, to be trusted on the local computer
#
openssl ecparam -name prime256v1 -genkey -noout -out $ROOT_CERT_FILE_PREFIX.key
if [ $? -ne 0 ]; then
  exit 1
fi

openssl req -x509 \
    -new \
    -key $ROOT_CERT_FILE_PREFIX.key \
    -out $ROOT_CERT_FILE_PREFIX.pem \
    -subj "/CN=$ROOT_CERT_DESCRIPTION" \
    -addext 'basicConstraints=critical,CA:TRUE' \
    -days 3650
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Create an SSL key pair for development
#
openssl ecparam -name prime256v1 -genkey -noout -out $SSL_CERT_FILE_PREFIX.key
if [ $? -ne 0 ]; then
  exit 1
fi

openssl req \
    -new \
    -key $SSL_CERT_FILE_PREFIX.key \
    -out $SSL_CERT_FILE_PREFIX.csr \
    -subj "/CN=$WILDCARD_DOMAIN_NAME" \
    -addext 'basicConstraints=critical,CA:FALSE'
if [ $? -ne 0 ]; then
  exit 1
fi

openssl x509 -req \
    -in $SSL_CERT_FILE_PREFIX.csr \
    -CA $ROOT_CERT_FILE_PREFIX.pem \
    -CAkey $ROOT_CERT_FILE_PREFIX.key \
    -out $SSL_CERT_FILE_PREFIX.pem \
    -days 365 \
    -extfile altnames.ext
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Clean up
#
rm *.csr 2>/dev/null
rm *.srl 2>/dev/null
exit 0