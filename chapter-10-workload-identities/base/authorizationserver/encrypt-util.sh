#!/bin/bash

################################################################################
# Curity Identity Server specific encryption to protect secrets in configuration
################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Usage of this helper module
#
function usage_message() {
  echo "Usage: './encrypt_util.sh type plaintextdata encryptionkey', where type is 'plaintext' or 'base64keystore'"
}

#
# Uses an encryptor that takes plaintext and produces data:text/plain encrypted output
#
function encrypt_plaintext() {

	XML_FILE=$(mktemp)
	XSLT_FILE=$(mktemp)
	trap 'rm -f "$XML_FILE $XSLT_FILE"' EXIT

	cat <<'EOF' > $XSLT_FILE
<stylesheet version="1.0" xmlns="http://www.w3.org/1999/XSL/Transform"
            xmlns:b="https://curity.se/ns/conf/base"
            xmlns:jdbc="https://curity.se/ns/ext-conf/jdbc"
            xmlns:xalan="http://xml.apache.org/xalan"
            xmlns:sec="xalan://se.curity.identityserver.crypto.SecretConverter"
            exclude-result-prefixes="xalan">
    <output indent="no" omit-xml-declaration="yes"/>

    <param name="encryptionKey" select="initialValue"/>
    <param name="decryptionKeys"/>

    <template match="valueToEncrypt">
      <variable name="data">
        <value-of select="." />
      </variable>
      <value-of select="sec:reencryptSecret($data, $encryptionKey, $decryptionKeys)"/>
    </template>
    <template match="text()"/>
</stylesheet>
EOF

	cat <<EOF > $XML_FILE
<values>
  <valueToEncrypt>$PLAINTEXT</valueToEncrypt>
</values>
EOF

    java -cp "$CLASSPATH" org.apache.xalan.xslt.Process \
        -xsl "$XSLT_FILE" \
        -in "$XML_FILE" \
        -param encryptionKey "$ENCRYPTIONKEY"
}

#
# Uses an encryptor that takes base64 plaintext and produces data:application/p12 or data:application/pem encrypted output
#
function encrypt_base64keystore() {

	XML_FILE=$(mktemp)
	XSLT_FILE=$(mktemp)
	trap 'rm -f "$XML_FILE $XSLT_FILE"' EXIT

	cat <<'EOF' > $XSLT_FILE
<stylesheet version="1.0" xmlns="http://www.w3.org/1999/XSL/Transform"
            xmlns:b="https://curity.se/ns/conf/base"
            xmlns:xalan="http://xml.apache.org/xalan"
            xmlns:sec="xalan://se.curity.identityserver.crypto.ConvertKeyStore"
            exclude-result-prefixes="xalan">
    <output indent="no" omit-xml-declaration="yes"/>

    <param name="encryptionKey" select="initialValue"/>
    <param name="decryptionKeys"/>

    <template match="valueToEncrypt">
      <variable name="data">
        <value-of select="." />
      </variable>
      <value-of select="sec:reencryptKeyStores($data, $encryptionKey, $decryptionKeys)"/>
    </template>
    <template match="text()"/>
</stylesheet>
EOF

	cat <<EOF > $XML_FILE
<values>
  <valueToEncrypt>$PLAINTEXT</valueToEncrypt>
</values>
EOF

    java -cp "$CLASSPATH" org.apache.xalan.xslt.Process \
        -xsl "$XSLT_FILE" \
        -in "$XML_FILE" \
        -param encryptionKey "$ENCRYPTIONKEY"
}

#
# Check input parameters
#
if [ "$TYPE" != 'plaintext' -a "$TYPE" != 'base64keystore' ]; then
  usage_message
  exit 1
fi
if [ "$ENCRYPTIONKEY" == '' ]; then
  usage_message
  exit 1
fi

#
# Set the classpath
#
CLASSPATH="$IDSVR_HOME/lib/*:$IDSVR_HOME/lib/xml-tools/*"

#
# Check we have a path to the identity server
#
if [ "$IDSVR_HOME" == '' ]; then
  echo "The IDSVR_HOME environment variable has not been configured"
  exit 1
fi

#
# Do the encryption work
#
if [ "$TYPE" == 'plaintext' ]; then

  encrypt_plaintext "$PLAINTEXT" "$ENCRYPTIONKEY"

elif [ "$TYPE" == 'base64keystore' ]; then

  encrypt_base64keystore "$PLAINTEXT" "$ENCRYPTIONKEY"

fi