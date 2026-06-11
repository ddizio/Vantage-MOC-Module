FROM node:22-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# Install dependencies (postinstall runs `prisma generate`, which needs the schema)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy URL so `prisma generate` inside the build has a datasource; the real
# database path comes from the runtime environment.
ENV DATABASE_URL="file:/app/data/moc.db"
RUN npm run build

# Runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/app/data/uploads
VOLUME /app/data
EXPOSE 3000

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
