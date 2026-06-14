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

# Copy code
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

# ĐỒNG BỘ CẤU TRÚC BẢNG TRONG BƯỚC BUILD (Nơi file tsconfig.json đang có sẵn)
RUN npx payload migrate:push || echo "Migration skipped or completed"

# Tiến hành Build dự án sang Standalone
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# --- Bước 2: Chạy Production ---
FROM node:22.17.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy các thư mục tĩnh cần thiết từ bước build
COPY --from=builder /app/public ./public

# Tạo sẵn thư mục cache và thư mục chứa SQLite
RUN mkdir -p .next /app/data /app/media

# Copy thư mục build dạng standalone gọn nhẹ
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

# Trả lệnh khởi chạy về dạng máy chủ Node gốc gọn nhẹ
CMD HOSTNAME="0.0.0.0" node server.js
