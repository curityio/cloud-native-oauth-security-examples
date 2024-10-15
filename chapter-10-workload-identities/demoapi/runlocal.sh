#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# A script to configure environment variables, then build and run the API during development
#
export API_PORT=3000
export API_DB_CONNECTION="jdbc:postgresql://localhost:5432/products?user=demoapi&password=Password1"

#
# Build the Java SPIFFE library if required
#
./java-spiffe/build.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Then build this API
#
./gradlew shadowJar --warning-mode all
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Then run this API
#
java -jar ./build/libs/demoapi-1.0-SNAPSHOT-all.jar
if [ $? -ne 0 ]; then
  exit 1
fi
