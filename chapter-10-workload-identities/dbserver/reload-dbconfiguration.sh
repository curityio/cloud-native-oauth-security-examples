#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

echo 'New SVIDs were downloaded so database configuration is reloading ...'
psql -p 5432 -U postgres -c 'SELECT pg_reload_conf();'
