# Produktionsimage. Vercel bleibt der Default-Build; hier gilt das Node-Preset.
FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NITRO_PRESET=node-server \
    CI=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=8080

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
