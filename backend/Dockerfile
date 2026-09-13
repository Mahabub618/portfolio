# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1001 appuser && mkdir -p /app/uploads && chown -R appuser /app
COPY --from=build /app/target/portfolio-api-*.jar app.jar
USER appuser
EXPOSE 8080
# Sized for Render's free 512 MB instance: cap every JVM memory pool explicitly
# so heap + metaspace + threads + native buffers stay under the container limit.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=45", "-XX:MaxMetaspaceSize=128m", "-XX:MaxDirectMemorySize=64m", "-XX:ReservedCodeCacheSize=64m", "-Xss512k", "-XX:+UseSerialGC", "-jar", "/app/app.jar"]
