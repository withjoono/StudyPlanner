---
description: StudyPlanner 프론트엔드 배포 (Firebase Hosting)
---

# StudyPlanner 프론트엔드 배포

## 사전 설정

- **GCloud Config**: `studyplanner`
- **Firebase 계정**: `geobukacademy@gmail.com`
- **Firebase 프로젝트**: `studyplanner-new`
- **Hosting URL**: https://studyplanner-new.web.app

## 배포 단계

// turbo-all

1. gcloud/firebase 계정을 StudyPlanner 프로젝트용으로 전환합니다.

```powershell
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "studyplanner"
```

2. 프론트엔드를 빌드합니다.

```powershell
yarn build:frontend
```

3. Firebase Hosting에 배포합니다.

```powershell
firebase deploy --only hosting
```

4. 배포 확인

```
Hosting URL: https://studyplanner-new.web.app
```
