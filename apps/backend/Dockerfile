# Build stage
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 (모노레포 구조)
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# 의존성 설치
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

# shared-types 먼저 빌드
WORKDIR /app/packages/shared-types
RUN yarn build

# Backend Prisma 생성 및 빌드
WORKDIR /app/apps/backend
RUN yarn prisma:generate
RUN yarn build

# Production stage
FROM node:20-alpine AS production

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN yarn install --production --frozen-lockfile

# 빌드된 파일 복사
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# 작업 디렉토리를 backend로 변경
WORKDIR /app/apps/backend

# 포트 노출
EXPOSE 8080

# 환경변수 (Cloud Run은 기본적으로 8080 포트 사용)
ENV PORT=8080
ENV NODE_ENV=production

# 애플리케이션 실행
CMD ["node", "dist/main.js"]








