#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Wait up to 20 seconds for the Postgres server's workload identity to download
#
echo 'Waiting for X509 SVIDs ...'
COUNT=0;
while [[ COUNT -lt 20 ]] && [[ ! -f '/svids/svid_key.pem' ]]; do
  echo -n '.'
  sleep 1
  ((COUNT++))
done

#
# After initdb has created the volume, copy in the mutual TLS configuration
#
echo 'Configuring Postgres ...'
cp /tmp/postgresql.conf /var/lib/postgresql/data/postgresql.conf
cp /tmp/pg_hba.conf     /var/lib/postgresql/data/pg_hba.conf

#
# Next, run a background process that monitors SVID downloads and reloads the server configuration
#
echo 'Running a background job to detect SVID downloads ...'
bash -c "inotifywait -m -e modify /svids | \
   while read file; do \
       /tmp/reload-dbconfiguration.sh
   done" &
