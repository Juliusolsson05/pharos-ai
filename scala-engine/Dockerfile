# Multi-stage build for Pharos Scala Engine
FROM sbtscala/scala-sbt:eclipse-temurin-jammy-21.0.2_13_1.10.1_3.4.1 AS builder

WORKDIR /app
COPY build.sbt .
COPY project/ project/
RUN sbt update

COPY src/ src/
RUN sbt assembly && cp target/scala-3.4.1/pharos-engine-assembly-*.jar /app/app.jar

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/app.jar app.jar

EXPOSE 4100

ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
