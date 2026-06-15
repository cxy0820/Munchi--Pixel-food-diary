FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libgomp1 \
    python3 \
    python3-pip \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY requirements-rembg.txt ./
RUN python3 -m venv .venv \
  && .venv/bin/python -m pip install --no-cache-dir --upgrade pip \
  && .venv/bin/python -m pip install --no-cache-dir -r requirements-rembg.txt

ENV BACKGROUND_PROVIDER=rembg \
    ALLOW_LOCAL_REMBG=true \
    REMBG_PYTHON=/app/.venv/bin/python \
    U2NET_HOME=/app/models/rembg \
    REMBG_MODEL=u2netp \
    REMBG_TIMEOUT_MS=120000 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    MALLOC_ARENA_MAX=2

COPY . .

RUN npm run build
RUN mkdir -p /app/models/rembg \
  && .venv/bin/python -c "from rembg import new_session; new_session('u2netp')" \
  && chown -R node:node /app

USER node

EXPOSE 10000

CMD ["node", "src/server/index.mjs"]
