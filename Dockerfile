# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine AS runtime

RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/src/db ./src/db

RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

VOLUME /app/data

USER appuser

CMD ["sh", "-c", "npx drizzle-kit push && node dist/server/entry.mjs"]
