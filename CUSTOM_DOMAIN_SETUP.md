# studyplanner.kr 도메인 연결 가이드

## 📋 단계별 설정 방법

### 1단계: Firebase Console에서 커스텀 도메인 추가

1. **Firebase Console 열기**
   - URL: https://console.firebase.google.com/project/studyplanner-482610/hosting/sites

2. **커스텀 도메인 추가**
   - "도메인 추가" 또는 "Add custom domain" 버튼 클릭
   - `studyplanner.kr` 입력
   - 계속 진행

3. **도메인 소유권 확인**
   Firebase가 TXT 레코드를 제공합니다.

---

### 2단계: DNS 설정 (도메인 등록 업체에서)

도메인 등록 업체(가비아, 호스팅KR, AWS Route53 등)의 DNS 관리 페이지로 이동하세요.

#### A. 소유권 확인을 위한 TXT 레코드 추가

Firebase Console에서 제공하는 정보를 사용:

```
Type: TXT
Name: @
Value: [Firebase에서 제공하는 값]
TTL: 3600 (또는 기본값)
```

#### B. 도메인 연결을 위한 A 레코드 추가

**주 도메인 (studyplanner.kr):**

```
Type: A
Name: @
Value: [Firebase에서 제공하는 IP 주소들]
```

Firebase는 보통 다음 IP 주소들을 제공합니다:

- `151.101.1.195`
- `151.101.65.195`

**www 서브도메인 (선택사항):**

```
Type: A
Name: www
Value: [Firebase에서 제공하는 IP 주소들]
```

또는 CNAME 레코드 사용:

```
Type: CNAME
Name: www
Value: studyplanner.kr
TTL: 3600
```

---

### 3단계: DNS 설정 예시

#### 가비아 (Gabia)

1. 가비아 로그인 > My가비아 > 도메인 관리
2. 해당 도메인 선택 > DNS 정보 > DNS 설정
3. 위의 레코드 추가

#### 호스팅KR

1. 호스팅KR 로그인 > 도메인 관리
2. 해당 도메인 선택 > DNS 관리
3. 위의 레코드 추가

#### AWS Route53

1. Route53 > Hosted zones
2. 해당 도메인 선택 > Create record
3. 위의 레코드 추가

#### Cloudflare

1. Cloudflare 대시보드 > DNS
2. Add record
3. 위의 레코드 추가
   - ⚠️ **중요**: Proxy status를 "DNS only" (회색 구름)로 설정

---

### 4단계: 검증 및 SSL 인증서

1. **DNS 전파 대기**
   - DNS 변경사항이 전파되는데 최대 24-48시간 소요
   - 보통 몇 분~몇 시간 내 완료

2. **Firebase에서 자동 검증**
   - Firebase가 TXT 레코드를 확인하여 도메인 소유권 검증
   - 자동으로 SSL 인증서 프로비저닝 (Let's Encrypt)

3. **상태 확인**
   - Firebase Console > Hosting > 도메인 탭에서 상태 확인
   - "Connected" 상태가 되면 완료

---

## 🔍 DNS 전파 확인 방법

### 온라인 도구

- https://dnschecker.org/
- https://www.whatsmydns.net/

### 명령줄 도구

```bash
# Windows (PowerShell)
nslookup studyplanner.kr

# TXT 레코드 확인
nslookup -type=TXT studyplanner.kr

# A 레코드 확인
nslookup -type=A studyplanner.kr
```

---

## ⚡ 빠른 체크리스트

- [ ] Firebase Console에서 "도메인 추가" 클릭
- [ ] `studyplanner.kr` 입력
- [ ] Firebase가 제공하는 TXT 레코드를 DNS에 추가
- [ ] Firebase가 제공하는 A 레코드를 DNS에 추가
- [ ] DNS 전파 대기 (보통 10분~2시간)
- [ ] Firebase Console에서 "Connected" 상태 확인
- [ ] https://studyplanner.kr 접속 테스트

---

## 🔧 문제 해결

### 1. "도메인 소유권을 확인할 수 없습니다" 오류

- TXT 레코드가 올바르게 입력되었는지 확인
- DNS 전파 대기 (최대 48시간)
- nslookup으로 TXT 레코드 확인

### 2. SSL 인증서 오류

- DNS A 레코드가 올바른지 확인
- Firebase가 제공한 IP 주소를 정확히 입력했는지 확인
- 최대 24시간 대기 (SSL 프로비저닝 시간)

### 3. Cloudflare 사용 시

- Proxy를 끄고 "DNS only" 모드로 설정
- 또는 Firebase 대신 Cloudflare의 SSL을 사용

---

## 📞 도메인 등록 업체가 어디신가요?

도메인을 어디서 등록하셨는지 알려주시면 더 구체적인 DNS 설정 방법을 안내해드리겠습니다:

- 가비아 (Gabia)
- 호스팅KR
- AWS Route53
- Cloudflare
- GoDaddy
- 기타

---

## 🎯 예상 소요 시간

- DNS 설정: 5-10분
- DNS 전파: 10분 ~ 2시간 (보통 30분 이내)
- SSL 인증서 프로비저닝: 자동, 몇 분 ~ 24시간
- **총 예상 시간: 1-2시간**

---

## ✅ 완료 확인

설정이 완료되면:

1. https://studyplanner.kr 접속 가능
2. HTTPS 자동 적용 (SSL 인증서)
3. Firebase Hosting의 모든 기능 사용 가능
