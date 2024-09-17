#
# A custom Docker image for the database server with tools to enable it to detect newly downloaded SVIDs
#

FROM postgres:16-bookworm

RUN apt-get update && apt-get install -y inotify-tools

COPY init-dbserver.sh            /docker-entrypoint-initdb.d/init-dbserver.sh
COPY schema.sql                  /docker-entrypoint-initdb.d/schema.sql
COPY reload-dbconfiguration.sh   /tmp
COPY postgresql.conf             /tmp/postgresql.conf
COPY pg_hba.conf                 /tmp/pg_hba.conf

USER postgres
