# 🚨 Firebase Hosting Site Not Found 문제 해결

## 현재 상황

- Firebase CLI로 배포는 성공 (12-13개 파일 업로드 완료)
- 하지만 모든 URL에서 "Site Not Found" 404 에러
- DNS는 올바르게 설정됨 (151.101.1.195)
- 라이브 버전도 "Site Not Found" 상태

## 원인

Firebase Hosting이 **활성화되지 않았거나**, **릴리스가 라이브로 설정되지 않았을** 가능성

---

## 🔧 해결 방법 (Firebase Console에서)

### 1단계: Firebase Console 접속

https://console.firebase.google.com/project/studyplanner-482610/hosting

### 2단계: 확인 사항

#### A. 시작하기 버튼 확인

- **"Firebase Hosting 시작하기"** 버튼이 있나요?
  - ✅ 있다면: 클릭해서 Hosting 활성화
  - ❌ 없다면: 다음 단계로

#### B. 사이트 목록 확인

- `studyplanner-482610` 사이트가 보이나요?
- 사이트 클릭

#### C. 릴리스 탭 확인

1. **"릴리스 및 롤백"** 또는 **"Releases"** 탭 클릭
2. 최근 배포 확인:
   - 상태가 **"라이브"** 인가요?
   - 아니면 **"대기 중"** 또는 다른 상태?

#### D. 배포 활성화

만약 최신 배포가 라이브 상태가 아니라면:

1. 최신 배포의 **"⋮"** (점 3개 메뉴) 클릭
2. **"라이브로 설정"** 또는 **"Promote to live"** 선택

### 3단계: 사이트 설정 확인

1. **설정** 또는 **"Settings"** 탭
2. 사이트가 **"활성"** 상태인지 확인
3. 혹시 **"일시 중지됨"** 또는 **"비활성화됨"** 상태라면 활성화

---

## 🆘 대안: 새 사이트 생성

만약 위 방법이 모두 안 된다면:

### Firebase Console에서:

1. Hosting 페이지
2. **"사이트 추가"** 또는 **"Add site"**
3. 새 사이트 ID 입력 (예: `studyplanner-main`)
4. `.firebaserc` 파일 수정:
   ```json
   {
     "projects": {
       "default": "studyplanner-482610"
     },
     "targets": {
       "studyplanner-482610": {
         "hosting": {
           "main": ["studyplanner-main"]
         }
       }
     }
   }
   ```
5. 재배포:
   ```bash
   firebase deploy --only hosting:main
   ```

---

## 📞 체크리스트

Firebase Console에서 확인:

- [ ] Hosting이 활성화되어 있나요?
- [ ] 사이트가 존재하나요?
- [ ] 최근 배포가 "라이브" 상태인가요?
- [ ] 사이트가 "활성" 상태인가요?
- [ ] 도메인이 연결되어 있나요?

---

## 🎯 테스트 URL

배포 후 확인:

- 기본: https://studyplanner-482610.web.app
- 커스텀: https://studyplanner.kr
- WWW: https://www.studyplanner.kr

---

## 📱 문의 정보

Firebase Console에서 확인 후:

- 어떤 화면이 보이는지
- 최근 배포의 상태가 무엇인지
- 오류 메시지가 있는지

알려주시면 추가 지원 가능합니다!
