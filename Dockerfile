# --- Bước 1: Build mã nguồn ---
FROM node:22.17.0-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Cài đặt dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy toàn bộ code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi


# --- Bước 2: Chạy Production ---
FROM node:22.17.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

# Tạo thư mục cần thiết cho Next, SQLite và media
RUN mkdir -p .next /app/data /app/media

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy thêm những file cần cho Payload CLI migration trên Railway
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

ENV PORT=3000

CMD HOSTNAME="0.0.0.0" node server.js