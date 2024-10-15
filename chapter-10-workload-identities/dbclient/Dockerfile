#
# The main container where we can run a shell and manually call the database server
#
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y postgresql-client

RUN groupadd --gid 10001 dbclient \
  && useradd --uid 10001 --gid dbclient --shell /bin/bash --create-home dbclient
USER 10001

CMD ["/bin/sleep", "infinity"]
