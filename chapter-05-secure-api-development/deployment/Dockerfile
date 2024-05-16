FROM node:20-bookworm-slim

RUN apt-get update && apt-get install curl -y

WORKDIR /usr/api
COPY dist                /usr/api/dist
COPY data/*              /usr/api/data/
COPY package*.json       /usr/api/

RUN npm clean-install --production

RUN groupadd --gid 10000 apiuser && useradd --uid 10001 --gid apiuser --shell /bin/bash --create-home apiuser
USER 10001

CMD ["node", "dist/server.js"]
