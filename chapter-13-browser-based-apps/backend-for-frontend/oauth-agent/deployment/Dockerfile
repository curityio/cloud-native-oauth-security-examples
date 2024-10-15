FROM node:20-bookworm-slim

RUN apt-get update && apt-get install curl -y

WORKDIR /usr/oauth-agent
COPY /dist                /usr/oauth-agent/dist
COPY /package*.json       /usr/oauth-agent/

RUN npm clean-install --production

RUN groupadd --gid 10000 bffuser && useradd --uid 10001 --gid bffuser --shell /bin/bash --create-home bffuser
USER 10001

CMD ["node", "dist/server.js"]
