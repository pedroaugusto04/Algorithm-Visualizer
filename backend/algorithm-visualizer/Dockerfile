FROM eclipse-temurin:21-alpine

RUN apk add --no-cache docker-cli

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline

COPY src ./src
COPY instrumenter.py ./instrumenter.py

EXPOSE 8081

USER root

ENTRYPOINT ["./mvnw","spring-boot:run"]