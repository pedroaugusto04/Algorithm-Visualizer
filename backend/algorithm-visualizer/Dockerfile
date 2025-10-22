FROM eclipse-temurin:21-alpine

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src ./src

EXPOSE 8080

ENTRYPOINT ["./mvnw","spring-boot:run"]