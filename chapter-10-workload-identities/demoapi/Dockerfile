FROM azul/zulu-openjdk-debian:21-jre-latest
RUN apt-get update && apt-get install -y curl

WORKDIR /usr/api
COPY build/libs/demoapi-1.0-SNAPSHOT-all.jar /usr/api/

RUN groupadd --gid 10000 demoapi \
  && useradd --uid 10001 --gid demoapi --shell /bin/bash --create-home demoapi
USER 10001

CMD ["java", "-jar", "/usr/api/demoapi-1.0-SNAPSHOT-all.jar"]
