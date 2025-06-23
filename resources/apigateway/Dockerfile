FROM kong/kong:3.9-ubuntu

#
# Install libraries our example plugins depend upon
#
USER root
RUN apt-get update
RUN apt-get install -y git unzip wget

RUN git config --global url."https://".insteadOf git:// && \
    git config --global advice.detachedHead false && \
    luarocks install lua-resty-http && \
    luarocks install lua-resty-jwt

USER kong
