FROM node:24.16-bookworm-slim

ENV NODE_ENV=development \
    HUSKY=0 \
    PNPM_HOME=/usr/local/share/pnpm \
    PATH=/usr/local/share/pnpm:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@11.12.0

WORKDIR /app
RUN chown -R node:node /app

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./

USER node
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 3001 9229

CMD ["sh", "-c", "pnpm prisma generate && pnpm start"]
