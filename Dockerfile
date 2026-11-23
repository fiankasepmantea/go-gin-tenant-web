# Production image for the web console. Build:  docker build -t go-gin-tenant-web .
# Run:    docker run -p 3000:3000 -e API_URL=http://api:8080 go-gin-tenant-web
# Runtime settings are environment variables (see README.md): API_URL, TENANT_BASE_DOMAIN, CSP_REPORT_ONLY.
# Nothing secret is baked into the image.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# "output: standalone" (next.config.mjs) gives a small server; static files are copied next to it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# /login is public and never calls the API, so it answers as soon as the server is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "server.js"]
