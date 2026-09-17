# Coc Docs Platform — the backend, built and run.
#
# Two stages: Maven builds the jar, a JRE runs it. The build image carries a
# JDK, Maven and the whole dependency cache — several hundred megabytes that a
# running server has no use for.
#
# Context is the repository root, so that this file can live in infra/ with
# everything else it is deployed alongside:
#
#   docker build -f infra/backend.Dockerfile .

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src

# The pom alone first, so that `go-offline` is cached against it. Copying the
# sources at the same time would re-download every dependency whenever any
# source file changed, which on this project is most builds.
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY backend/src ./src

# Tests are NOT run here, deliberately. The integration suite needs Docker
# (Testcontainers) and this is already inside a build container; running them
# would need docker-in-docker for no benefit, because the same tests run in CI
# where they belong. A deployment build compiles a commit that was already
# tested — it is not the place to find out.
RUN mvn -B -q -DskipTests package

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS run

# Not root. A remote-code-execution bug in a web application is bad; one that
# lands as uid 0 inside the container is worse for no reason.
RUN addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER app

EXPOSE 8080

# MaxRAMPercentage rather than a fixed -Xmx: the JVM then sizes its heap from
# whatever the container is actually given, so changing the compose memory
# limit is enough and there is no second number to keep in step.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+ExitOnOutOfMemoryError"

# Shell form, so $JAVA_OPTS is expanded. exec so the JVM is pid 1 and receives
# SIGTERM directly — without it, `docker stop` kills the shell and the JVM is
# killed 10 seconds later by the timeout, which skips every shutdown hook,
# including the one that closes open notification streams (ADR-028).
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
