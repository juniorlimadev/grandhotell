# Estágio 1: build da aplicação
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src src
RUN mvn package -DskipTests -B

# Estágio 2: imagem final para execução
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN adduser -D -s /bin/sh appuser
COPY --from=build /app/target/*.jar app.jar
RUN chown -R appuser:appuser /app

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
