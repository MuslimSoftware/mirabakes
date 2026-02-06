FROM oven/bun:1.2.17-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["./scripts/dev-container-entrypoint.sh"]
