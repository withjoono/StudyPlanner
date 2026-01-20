# Google Cloud Run 배포 가이드

## 📋 사전 준비사항

### 1. Google Cloud 결제 활성화 ⚠️ 필수

Cloud Run을 사용하려면 프로젝트에 결제 계정을 연결해야 합니다.

**결제 활성화 방법:**

1. https://console.cloud.google.com/billing/linkedaccount?project=studyplanner-482610
2. 결제 계정 선택 또는 새로 만들기
3. 프로젝트에 연결

**참고:** Google Cloud는 무료 크레딧과 무료 티어를 제공합니다:

- 신규 가입 시 $300 무료 크레딧 (90일)
- Cloud Run 무료 티어: 월 2백만 요청, 180,000 vCPU-초, 360,000 GiB-초

---

## 🚀 배포 단계

### 1단계: 결제 활성화 후 빌드

```bash
cd E:\Dev\github\StudyPlanner
gcloud builds submit --config cloudbuild.yaml
```

### 2단계: Cloud Run에 배포

```bash
gcloud run deploy studyplanner-backend \
  --image gcr.io/studyplanner-482610/backend:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

**파라미터 설명:**

- `--region asia-northeast3`: 서울 리전
- `--allow-unauthenticated`: 공개 액세스 허용
- `--port 8080`: 애플리케이션 포트
- `--memory 512Mi`: 메모리 할당
- `--min-instances 0`: 최소 인스턴스 (비용 절감)
- `--max-instances 10`: 최대 인스턴스 (부하 대응)

### 3단계: 환경 변수 설정 (필요시)

```bash
gcloud run services update studyplanner-backend \
  --region asia-northeast3 \
  --set-env-vars="DATABASE_URL=your-database-url,NODE_ENV=production"
```

---

## 🌐 커스텀 도메인 연결

### 방법 1: Cloud Run 도메인 매핑 (권장)

#### 1. 도메인 매핑 생성

```bash
gcloud run domain-mappings create \
  --service studyplanner-backend \
  --domain api.studyplanner.kr \
  --region asia-northeast3
```

#### 2. DNS 설정

위 명령 실행 후 표시되는 DNS 레코드를 도메인 등록 업체에 추가:

```
Type: CNAME
Name: api (또는 api.studyplanner.kr)
Value: ghs.googlehosted.com
```

또는 A 레코드:

```
Type: A
Name: api
Value: [Cloud Run이 제공하는 IP 주소]
```

#### 3. SSL 인증서 자동 발급

도메인 매핑 후 Google이 자동으로 SSL 인증서를 발급합니다 (Let's Encrypt).

### 방법 2: Cloudflare + Cloud Run

Cloudflare를 사용 중이라면:

1. Cloudflare DNS에 CNAME 레코드 추가:

   ```
   Type: CNAME
   Name: api
   Target: [Cloud Run URL - xxx.run.app]
   Proxy: Enabled (주황색 구름)
   ```

2. Cloudflare에서 SSL 설정:
   - SSL/TLS > Overview > Full (strict)

---

## 📊 배포 확인

### 서비스 상태 확인

```bash
gcloud run services describe studyplanner-backend --region asia-northeast3
```

### 로그 확인

```bash
gcloud run logs read studyplanner-backend --region asia-northeast3 --limit 50
```

### 서비스 URL 확인

```bash
gcloud run services describe studyplanner-backend --region asia-northeast3 --format="value(status.url)"
```

---

## 🔄 업데이트 배포

코드를 수정한 후:

```bash
# 1. 이미지 다시 빌드
gcloud builds submit --config cloudbuild.yaml

# 2. Cloud Run 자동 업데이트 (latest 태그 사용 시)
# 또는 수동 업데이트:
gcloud run deploy studyplanner-backend \
  --image gcr.io/studyplanner-482610/backend:latest \
  --region asia-northeast3
```

---

## 🗄️ 데이터베이스 연결

### Cloud SQL (PostgreSQL) 사용 시

1. Cloud SQL 인스턴스 생성:

   ```bash
   gcloud sql instances create studyplanner-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=asia-northeast3
   ```

2. 데이터베이스 생성:

   ```bash
   gcloud sql databases create studyplanner \
     --instance=studyplanner-db
   ```

3. Cloud Run에서 Cloud SQL 연결:
   ```bash
   gcloud run services update studyplanner-backend \
     --region asia-northeast3 \
     --add-cloudsql-instances studyplanner-482610:asia-northeast3:studyplanner-db \
     --set-env-vars="DATABASE_URL=postgresql://user:password@/studyplanner?host=/cloudsql/studyplanner-482610:asia-northeast3:studyplanner-db"
   ```

### 외부 데이터베이스 사용 시

환경 변수로 DATABASE_URL 설정:

```bash
gcloud run services update studyplanner-backend \
  --region asia-northeast3 \
  --set-env-vars="DATABASE_URL=your-external-database-url"
```

---

## 💰 비용 최적화

### 무료 티어 유지 팁

1. **최소 인스턴스 0으로 설정**

   ```bash
   --min-instances 0
   ```

   요청이 없을 때 인스턴스를 0으로 줄여 비용 절감

2. **메모리 최소화**

   ```bash
   --memory 256Mi  # 필요에 따라 조정
   ```

3. **CPU 제한**
   ```bash
   --cpu 1  # 또는 --cpu-throttling
   ```

### 예상 비용 (무료 티어 초과 시)

- vCPU: $0.00002400/vCPU-초
- 메모리: $0.00000250/GiB-초
- 요청: $0.40/백만 요청

**예시:** 월 10만 요청, 평균 응답 시간 200ms, 512MB 메모리 사용

- 예상 비용: $1-2/월 (무료 티어 포함)

---

## 🔧 문제 해결

### 1. 빌드 실패

```bash
# 로그 확인
gcloud builds log [BUILD_ID]

# 로컬에서 Docker 빌드 테스트
docker build -f apps/backend/Dockerfile -t test-backend .
```

### 2. 배포 실패

```bash
# 서비스 로그 확인
gcloud run logs read studyplanner-backend --region asia-northeast3

# 서비스 상세 정보
gcloud run services describe studyplanner-backend --region asia-northeast3
```

### 3. Cold Start 지연

첫 요청 시 인스턴스 시작으로 인한 지연 발생 (5-10초).

**해결책:**

- `--min-instances 1` 설정 (항상 1개 인스턴스 유지, 비용 증가)
- 또는 Cold Start 최적화 (경량 이미지 사용)

### 4. 도메인 연결 실패

```bash
# 도메인 매핑 상태 확인
gcloud run domain-mappings describe \
  --domain api.studyplanner.kr \
  --region asia-northeast3

# DNS 전파 확인
nslookup api.studyplanner.kr
```

---

## 📚 참고 자료

- Cloud Run 문서: https://cloud.google.com/run/docs
- 가격 계산기: https://cloud.google.com/products/calculator
- Cloud Run 무료 티어: https://cloud.google.com/run/pricing

---

## ✅ 체크리스트

배포 완료 후 확인사항:

- [ ] 결제 계정 활성화
- [ ] Docker 이미지 빌드 성공
- [ ] Cloud Run 서비스 배포 성공
- [ ] 서비스 URL 접속 가능
- [ ] 데이터베이스 연결 설정
- [ ] 환경 변수 설정
- [ ] 커스텀 도메인 연결
- [ ] SSL 인증서 발급 완료
- [ ] Frontend에서 API 엔드포인트 업데이트
- [ ] 로그 모니터링 설정

---

## 🔗 Frontend 연결

Backend 배포 완료 후 Frontend의 환경 변수를 업데이트하세요:

**apps/frontend/.env.production:**

```env
VITE_API_URL=https://api.studyplanner.kr
# 또는 Cloud Run URL
VITE_API_URL=https://studyplanner-backend-xxx.run.app
```

재배포:

```bash
yarn build:frontend
firebase deploy --only hosting
```
