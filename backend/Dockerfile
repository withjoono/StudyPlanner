# Build stage - Debian slim for Prisma compatibility
FROM node:20-slim AS builder

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 (모노레포 구조)
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# 의존성 설치
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY backend ./backend

# Backend Prisma 생성 및 빌드
WORKDIR /app/backend
RUN yarn prisma:generate
RUN yarn build

# Production stage - Debian slim for Prisma compatibility
FROM node:20-slim AS production

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

RUN yarn install --production --frozen-lockfile

# 빌드된 파일 복사
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma


# 작업 디렉토리를 backend로 변경
WORKDIR /app/backend

# 포트 노출
EXPOSE 8080

# 환경변수 (Cloud Run은 기본적으로 8080 포트 사용)
ENV PORT=8080
ENV NODE_ENV=production

# 애플리케이션 실행
CMD ["node", "dist/main.js"]








