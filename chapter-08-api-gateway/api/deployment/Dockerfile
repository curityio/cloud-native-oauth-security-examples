FROM node:20-bookworm-slim

WORKDIR /usr/api
COPY ./src/index.mjs /usr/api

RUN groupadd --gid 10000 apiuser \
  && useradd --uid 10001 --gid apiuser --shell /bin/bash --create-home apiuser
USER 10001

CMD ["node", "index.mjs"]
