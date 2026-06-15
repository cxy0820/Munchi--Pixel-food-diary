FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

ENV BACKGROUND_PROVIDER=removebg \
    ALLOW_LOCAL_REMBG=false

COPY . .

RUN npm run build \
  && chown -R node:node /app

USER node

EXPOSE 10000

CMD ["node", "src/server/index.mjs"]
