#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run a background process that monitors SVID downloads and reloads the server configuration
#
echo 'Running a background job to detect SVID downloads ...'
bash -c "inotifywait -m -e modify /svids | \
   while read file; do \
       /tmp/reload-dbconfiguration.sh
   done" &
