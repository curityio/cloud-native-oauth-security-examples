#
# A custom Docker image for the database server with tools to enable it to detect newly downloaded SVIDs
#

FROM postgres:17.2

RUN apt-get update && apt-get install -y inotify-tools

COPY postgresql.conf             /etc/postgresql/postgresql.conf
COPY pg_hba.conf                 /etc/postgresql/pg_hba.conf
COPY init-dbserver.sh            /docker-entrypoint-initdb.d/init-dbserver.sh
COPY schema.sql                  /docker-entrypoint-initdb.d/schema.sql
COPY reload-dbconfiguration.sh   /tmp

USER postgres
