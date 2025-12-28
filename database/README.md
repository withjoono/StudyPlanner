# GB Planner Database

## 빠른 시작

### 1. Docker로 MySQL 실행

```bash
# 프로젝트 루트에서 실행
docker-compose up -d
```

MySQL이 시작되면 자동으로 `database/init/` 폴더의 SQL 파일들이 실행됩니다:

- `01-schema.sql`: 테이블 생성
- `02-seed.sql`: 샘플 데이터 삽입

### 2. 접속 정보

| 항목          | 값          |
| ------------- | ----------- |
| Host          | localhost   |
| Port          | 3306        |
| Database      | gb_planner  |
| Username      | gb_user     |
| Password      | gb_password |
| Root Password | root1234    |

### 3. 데이터베이스 연결 테스트

```bash
# MySQL CLI로 접속
docker exec -it gb-planner-db mysql -ugb_user -pgb_password gb_planner

# 또는 직접 접속
mysql -h localhost -P 3306 -ugb_user -pgb_password gb_planner
```

### 4. 백엔드 환경 설정

`apps/backend/.env.local` 파일을 생성하세요:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=gb_user
DB_PASSWORD=gb_password
DB_DATABASE=gb_planner
```

## 데이터베이스 관리

### 컨테이너 관리

```bash
# 시작
docker-compose up -d

# 중지
docker-compose down

# 중지 및 볼륨 삭제 (데이터 초기화)
docker-compose down -v

# 로그 확인
docker-compose logs -f mysql
```

### 스키마 재생성

데이터베이스를 완전히 초기화하려면:

```bash
# 1. 컨테이너와 볼륨 삭제
docker-compose down -v

# 2. 다시 시작 (init 스크립트가 자동 실행됨)
docker-compose up -d
```

### 수동으로 SQL 실행

```bash
# 스키마만 적용
docker exec -i gb-planner-db mysql -ugb_user -pgb_password gb_planner < database/init/01-schema.sql

# 샘플 데이터 적용
docker exec -i gb-planner-db mysql -ugb_user -pgb_password gb_planner < database/init/02-seed.sql
```

## 파일 구조

```
database/
├── init/
│   ├── 01-schema.sql    # 테이블 스키마
│   └── 02-seed.sql      # 샘플 데이터
└── README.md            # 이 파일
```

## 테이블 목록

| 테이블            | 설명                  |
| ----------------- | --------------------- |
| student           | 학생 인적사항         |
| weekly_routine    | 주간 루틴             |
| long_term_plan    | 장기 계획             |
| daily_mission     | 일일 미션 (단기 계획) |
| mission_result    | 미션 결과             |
| lesson            | 수업                  |
| mentoring         | 멘토링                |
| student_lesson    | 학생-수업 연결        |
| student_mentoring | 학생-멘토링 연결      |

자세한 스키마 정보는 [docs/DATABASE.md](../docs/DATABASE.md)를 참조하세요.















