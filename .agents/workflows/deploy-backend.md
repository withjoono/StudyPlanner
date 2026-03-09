---
description: StudyPlanner 백엔드 배포 (App Engine)
---

# StudyPlanner 백엔드 배포

## 사전 설정

- **GCloud Config**: `studyplanner`
- **계정**: `geobukacademy@gmail.com`
- **GCP 프로젝트**: `ts-back-nest-479305` (App Engine은 Hub 프로젝트에 배포)
- **서비스명**: `studyplanner-backend`
- **API URL**: https://studyplanner-backend-dot-ts-back-nest-479305.du.r.appspot.com

## 배포 단계

// turbo-all

1. gcloud 계정을 StudyPlanner 프로젝트용으로 전환합니다.

```powershell
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "studyplanner"
```

2. 백엔드를 빌드합니다.

```powershell
cd backend && yarn build
```

3. App Engine에 배포합니다.

```powershell
gcloud app deploy app.yaml --project=ts-back-nest-479305 --quiet
```
