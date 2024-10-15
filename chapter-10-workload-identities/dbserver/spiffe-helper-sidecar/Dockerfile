#
# The SPIFFE helper sidecar container uses the same user ID as the main container
# The main container then has permissions to read downloaded SVID private keys
#

FROM debian:bookworm-slim

WORKDIR /spiffehelper
COPY spiffe-helper /spiffehelper
COPY helper.conf   /spiffehelper

RUN groupadd --gid 10001 spiffehelper \
  && useradd --uid 999 --gid spiffehelper --shell /bin/bash --create-home spiffehelper
USER 999

CMD ["./spiffe-helper"]
