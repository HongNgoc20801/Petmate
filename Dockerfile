# --- Bước 1: Build mã nguồn ---
FROM node:22.17.0-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Cài đặt dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy code và build dự án
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

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

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Cấu hình cache hệ thống Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Tạo thư mục dữ liệu SQLite và media, phân quyền cho user nextjs
RUN mkdir -p /app/data /app/media
RUN chown -R nextjs:nodejs /app/data /app/media

# Copy thư mục build dạng standalone gọn nhẹ
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node server.js
