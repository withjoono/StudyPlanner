# GB Planner 데이터베이스 스키마

## 목차

1. [ERD 다이어그램](#erd-다이어그램)
2. [테이블 정의](#테이블-정의)
3. [ENUM 타입 정의](#enum-타입-정의)
4. [인덱스 설계](#인덱스-설계)
5. [SQL 스키마](#sql-스키마)

---

## ERD 다이어그램

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     student     │       │  weekly_routine │       │   long_term_plan│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ student_code    │◄──────│ student_id (FK) │       │ student_id (FK) │──────►
│ year            │       │ title           │       │ title           │
│ school_level    │       │ category        │       │ category        │
│ school_name     │       │ sub_category    │       │ sub_category    │
│ grade           │       │ subject         │       │ subject         │
│ name            │       │ content         │       │ content         │
│ school_type     │       │ start_time      │       │ start_date      │
│ phone           │       │ end_time        │       │ end_date        │
│ parent_phone    │       │ day_mon         │       │ material_type   │
│ email           │       │ day_tue         │       │ material_name   │
│ parent_email    │       │ day_wed         │       │ total_pages     │
│ ...             │       │ day_thu         │       │ done_pages      │
└────────┬────────┘       │ day_fri         │       │ ...             │
         │                │ day_sat         │       └────────┬────────┘
         │                │ day_sun         │                │
         │                │ ...             │                │
         │                └─────────────────┘                │
         │                                                   │
         │                ┌─────────────────┐                │
         │                │   daily_mission │                │
         │                ├─────────────────┤                │
         │                │ id (PK)         │                │
         └───────────────►│ student_id (FK) │◄───────────────┘
                          │ plan_id (FK)    │
                          │ mission_code    │
                          │ date            │
                          │ start_time      │
                          │ end_time        │
                          │ category        │
                          │ subject         │
                          │ sub_category    │
                          │ content         │
                          │ start_page      │
                          │ end_page        │
                          │ amount          │
                          │ status          │
                          │ ...             │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │ mission_result  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ mission_id (FK) │
                          │ result_code     │
                          │ completed_date  │
                          │ amount          │
                          │ achievement_rate│
                          │ correct_count   │
                          │ total_questions │
                          │ score           │
                          │ focus_rate      │
                          │ ...             │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     lesson      │       │    mentoring    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ lesson_code     │       │ mentoring_code  │
│ grade           │       │ grade           │
│ subject         │       │ subject         │
│ start_date      │       │ start_date      │
│ name            │       │ name            │
│ teacher_name    │       │ mentor_name     │
│ weekly_count    │       │ weekly_count    │
│ duration        │       │ duration        │
│ schedule (JSON) │       │ schedule (JSON) │
│ price           │       │ price           │
│ price_type      │       │ price_type      │
│ ...             │       │ ...             │
└─────────────────┘       └─────────────────┘
```

---

## 테이블 정의

### 1. student (학생 인적사항)

| 컬럼명       | 타입         | 제약조건           | 설명                          |
| ------------ | ------------ | ------------------ | ----------------------------- |
| id           | BIGINT       | PK, AUTO_INCREMENT | 내부 ID                       |
| student_code | VARCHAR(20)  | UNIQUE, NOT NULL   | 학생 코드 (ST00001)           |
| year         | INT          | NOT NULL           | 년도 (2025)                   |
| school_level | ENUM         | NOT NULL           | 초/중/고                      |
| school_name  | VARCHAR(50)  |                    | 학교명                        |
| grade        | VARCHAR(10)  |                    | 학년 (H1, H2, H3 등)          |
| name         | VARCHAR(50)  | NOT NULL           | 학생명                        |
| school_type  | ENUM         |                    | 학교 타입 (일반고, 특목고 등) |
| phone        | VARCHAR(20)  |                    | 학생 연락처                   |
| parent_phone | VARCHAR(20)  |                    | 학부모 연락처                 |
| email        | VARCHAR(100) |                    | 학생 이메일                   |
| parent_email | VARCHAR(100) |                    | 학부모 이메일                 |
| created_at   | TIMESTAMP    | DEFAULT NOW()      | 생성일시                      |
| updated_at   | TIMESTAMP    | ON UPDATE NOW()    | 수정일시                      |

### 2. weekly_routine (주간 루틴)

| 컬럼명       | 타입         | 제약조건           | 설명                              |
| ------------ | ------------ | ------------------ | --------------------------------- |
| id           | BIGINT       | PK, AUTO_INCREMENT | 내부 ID                           |
| routine_code | VARCHAR(20)  | UNIQUE             | 루틴 코드 (R001)                  |
| student_id   | BIGINT       | FK → student.id    | 학생 ID                           |
| title        | VARCHAR(100) |                    | 루틴 제목                         |
| category     | ENUM         |                    | 분류1 (학습, 운동, 활동, 휴식 등) |
| sub_category | VARCHAR(50)  |                    | 분류2 (학원수업, 수행, 자습 등)   |
| subject      | VARCHAR(50)  |                    | 과목 (국어, 수학, 영어 등)        |
| content      | VARCHAR(200) |                    | 내용                              |
| start_time   | TIME         |                    | 시작 시간                         |
| end_time     | TIME         |                    | 끝 시간                           |
| day_mon      | BOOLEAN      | DEFAULT FALSE      | 월요일                            |
| day_tue      | BOOLEAN      | DEFAULT FALSE      | 화요일                            |
| day_wed      | BOOLEAN      | DEFAULT FALSE      | 수요일                            |
| day_thu      | BOOLEAN      | DEFAULT FALSE      | 목요일                            |
| day_fri      | BOOLEAN      | DEFAULT FALSE      | 금요일                            |
| day_sat      | BOOLEAN      | DEFAULT FALSE      | 토요일                            |
| day_sun      | BOOLEAN      | DEFAULT FALSE      | 일요일                            |
| is_active    | BOOLEAN      | DEFAULT TRUE       | 활성 여부                         |
| created_at   | TIMESTAMP    | DEFAULT NOW()      | 생성일시                          |
| updated_at   | TIMESTAMP    | ON UPDATE NOW()    | 수정일시                          |

### 3. long_term_plan (장기 계획)

| 컬럼명         | 타입         | 제약조건           | 설명                           |
| -------------- | ------------ | ------------------ | ------------------------------ |
| id             | BIGINT       | PK, AUTO_INCREMENT | 내부 ID                        |
| plan_code      | VARCHAR(20)  | UNIQUE             | 계획 코드 (LP01)               |
| student_id     | BIGINT       | FK → student.id    | 학생 ID                        |
| title          | VARCHAR(100) |                    | 계획 제목                      |
| category       | ENUM         |                    | 분류1 (학습, 운동, 활동, 휴식) |
| sub_category   | VARCHAR(50)  |                    | 분류2 (학원수업, 수행, 자습)   |
| subject        | VARCHAR(50)  |                    | 과목                           |
| content        | VARCHAR(200) |                    | 내용                           |
| start_date     | DATE         |                    | 시작 날짜                      |
| end_date       | DATE         |                    | 끝 날짜                        |
| material_type  | ENUM         |                    | 교재 타입 (교재, 강의)         |
| material_name  | VARCHAR(100) |                    | 교재/강의명                    |
| total_pages    | INT          |                    | 전체 페이지/강의 수            |
| done_pages     | INT          | DEFAULT 0          | 완료 페이지/강의 수            |
| is_distributed | BOOLEAN      | DEFAULT FALSE      | 일정 분배 여부                 |
| is_completed   | BOOLEAN      | DEFAULT FALSE      | 완료 여부                      |
| created_at     | TIMESTAMP    | DEFAULT NOW()      | 생성일시                       |
| updated_at     | TIMESTAMP    | ON UPDATE NOW()    | 수정일시                       |

### 4. daily_mission (단기 계획 / 일일 미션)

| 컬럼명       | 타입         | 제약조건                  | 설명                                           |
| ------------ | ------------ | ------------------------- | ---------------------------------------------- |
| id           | BIGINT       | PK, AUTO_INCREMENT        | 내부 ID                                        |
| mission_code | VARCHAR(30)  | UNIQUE, NOT NULL          | 미션 코드 (ST00001P25011601)                   |
| student_id   | BIGINT       | FK → student.id, NOT NULL | 학생 ID                                        |
| plan_id      | BIGINT       | FK → long_term_plan.id    | 연결된 장기계획 ID                             |
| routine_id   | BIGINT       | FK → weekly_routine.id    | 연결된 루틴 ID                                 |
| date         | DATE         | NOT NULL                  | 날짜                                           |
| start_time   | TIME         |                           | 시작 시간                                      |
| end_time     | TIME         |                           | 끝 시간                                        |
| category     | ENUM         |                           | 분류 (학습, 운동, 활동, 휴식)                  |
| subject      | VARCHAR(50)  |                           | 과목                                           |
| sub_category | VARCHAR(50)  |                           | 세부 분류 (수업 등)                            |
| content      | VARCHAR(200) |                           | 내용                                           |
| start_page   | INT          |                           | 시작 페이지/강의                               |
| end_page     | INT          |                           | 끝 페이지/강의                                 |
| amount       | INT          |                           | 분량                                           |
| status       | ENUM         | DEFAULT 'pending'         | 상태 (pending, fixed, changed, added, deleted) |
| created_at   | TIMESTAMP    | DEFAULT NOW()             | 생성일시                                       |
| updated_at   | TIMESTAMP    | ON UPDATE NOW()           | 수정일시                                       |

### 5. mission_result (미션 결과)

| 컬럼명           | 타입         | 제약조건                        | 설명                         |
| ---------------- | ------------ | ------------------------------- | ---------------------------- |
| id               | BIGINT       | PK, AUTO_INCREMENT              | 내부 ID                      |
| result_code      | VARCHAR(30)  | UNIQUE                          | 결과 코드 (ST00001O25011601) |
| mission_id       | BIGINT       | FK → daily_mission.id, NOT NULL | 미션 ID                      |
| student_id       | BIGINT       | FK → student.id, NOT NULL       | 학생 ID                      |
| completed_date   | DATE         |                                 | 완료 날짜                    |
| start_time       | TIME         |                                 | 실제 시작 시간               |
| end_time         | TIME         |                                 | 실제 끝 시간                 |
| amount           | INT          |                                 | 완료 분량                    |
| achievement_rate | DECIMAL(3,2) |                                 | 성취율 (0.00 ~ 1.00)         |
| correct_count    | INT          |                                 | 맞은 문항 수                 |
| total_questions  | INT          |                                 | 전체 문항 수                 |
| score            | DECIMAL(5,2) |                                 | 점수                         |
| focus_rate       | DECIMAL(3,2) |                                 | 몰입도 (0.00 ~ 1.00)         |
| note             | TEXT         |                                 | 비고                         |
| created_at       | TIMESTAMP    | DEFAULT NOW()                   | 생성일시                     |
| updated_at       | TIMESTAMP    | ON UPDATE NOW()                 | 수정일시                     |

### 6. lesson (수업)

| 컬럼명       | 타입         | 제약조건           | 설명                                         |
| ------------ | ------------ | ------------------ | -------------------------------------------- |
| id           | BIGINT       | PK, AUTO_INCREMENT | 내부 ID                                      |
| lesson_code  | VARCHAR(30)  | UNIQUE             | 수업 코드 (CK10S0125011601)                  |
| grade        | VARCHAR(10)  |                    | 학년 코드 (K10 등)                           |
| subject_code | VARCHAR(10)  |                    | 과목 코드 (S01 등)                           |
| start_date   | DATE         |                    | 수업 시작 날짜                               |
| name         | VARCHAR(100) |                    | 수업명                                       |
| teacher_name | VARCHAR(50)  |                    | 선생님명                                     |
| weekly_count | INT          |                    | 주당 수업 회수                               |
| duration     | VARCHAR(10)  |                    | 1회 수업 시간 (3H 등)                        |
| schedule     | JSON         |                    | 수업 일정 [{day, start_time, end_time}, ...] |
| price        | INT          |                    | 수업료                                       |
| price_type   | ENUM         |                    | 수업료 기준 (monthly, per_session)           |
| is_active    | BOOLEAN      | DEFAULT TRUE       | 활성 여부                                    |
| created_at   | TIMESTAMP    | DEFAULT NOW()      | 생성일시                                     |
| updated_at   | TIMESTAMP    | ON UPDATE NOW()    | 수정일시                                     |

### 7. mentoring (멘토링)

| 컬럼명         | 타입         | 제약조건           | 설명                          |
| -------------- | ------------ | ------------------ | ----------------------------- |
| id             | BIGINT       | PK, AUTO_INCREMENT | 내부 ID                       |
| mentoring_code | VARCHAR(30)  | UNIQUE             | 멘토링 코드 (MK10S0125011601) |
| grade          | VARCHAR(10)  |                    | 학년 코드                     |
| subject_code   | VARCHAR(10)  |                    | 과목 코드                     |
| start_date     | DATE         |                    | 시작 날짜                     |
| name           | VARCHAR(100) |                    | 멘토링명                      |
| mentor_name    | VARCHAR(50)  |                    | 멘토명                        |
| weekly_count   | INT          |                    | 주당 회수                     |
| duration       | VARCHAR(10)  |                    | 1회 시간                      |
| schedule       | JSON         |                    | 일정                          |
| price          | INT          |                    | 요금                          |
| price_type     | ENUM         |                    | 요금 기준                     |
| is_active      | BOOLEAN      | DEFAULT TRUE       | 활성 여부                     |
| created_at     | TIMESTAMP    | DEFAULT NOW()      | 생성일시                      |
| updated_at     | TIMESTAMP    | ON UPDATE NOW()    | 수정일시                      |

### 8. student_lesson (학생-수업 연결)

| 컬럼명      | 타입      | 제약조건           | 설명      |
| ----------- | --------- | ------------------ | --------- |
| id          | BIGINT    | PK, AUTO_INCREMENT | 내부 ID   |
| student_id  | BIGINT    | FK → student.id    | 학생 ID   |
| lesson_id   | BIGINT    | FK → lesson.id     | 수업 ID   |
| enrolled_at | DATE      |                    | 등록일    |
| is_active   | BOOLEAN   | DEFAULT TRUE       | 활성 여부 |
| created_at  | TIMESTAMP | DEFAULT NOW()      | 생성일시  |

### 9. student_mentoring (학생-멘토링 연결)

| 컬럼명       | 타입      | 제약조건           | 설명      |
| ------------ | --------- | ------------------ | --------- |
| id           | BIGINT    | PK, AUTO_INCREMENT | 내부 ID   |
| student_id   | BIGINT    | FK → student.id    | 학생 ID   |
| mentoring_id | BIGINT    | FK → mentoring.id  | 멘토링 ID |
| enrolled_at  | DATE      |                    | 등록일    |
| is_active    | BOOLEAN   | DEFAULT TRUE       | 활성 여부 |
| created_at   | TIMESTAMP | DEFAULT NOW()      | 생성일시  |

---

## ENUM 타입 정의

### school_level (학교 급)

```sql
ENUM('elementary', 'middle', 'high')
-- 초, 중, 고
```

### school_type (학교 타입)

```sql
ENUM('general', 'special', 'autonomous', 'foreign', 'science', 'art')
-- 일반고, 특목고, 자율고, 외고, 과학고, 예고
```

### category (대분류)

```sql
ENUM('study', 'exercise', 'activity', 'rest', 'other')
-- 학습, 운동, 활동, 휴식, 기타
```

### material_type (교재 타입)

```sql
ENUM('textbook', 'lecture')
-- 교재, 강의
```

### mission_status (미션 상태)

```sql
ENUM('pending', 'fixed', 'changed', 'added', 'deleted', 'completed')
-- 대기, 픽스, 변경, 추가, 삭제, 완료
```

### price_type (요금 기준)

```sql
ENUM('monthly', 'per_session')
-- 월간, 회당
```

---

## 인덱스 설계

```sql
-- student
CREATE INDEX idx_student_code ON student(student_code);
CREATE INDEX idx_student_year ON student(year);

-- weekly_routine
CREATE INDEX idx_routine_student ON weekly_routine(student_id);
CREATE INDEX idx_routine_active ON weekly_routine(is_active);

-- long_term_plan
CREATE INDEX idx_plan_student ON long_term_plan(student_id);
CREATE INDEX idx_plan_date ON long_term_plan(start_date, end_date);
CREATE INDEX idx_plan_subject ON long_term_plan(subject);

-- daily_mission
CREATE INDEX idx_mission_student ON daily_mission(student_id);
CREATE INDEX idx_mission_date ON daily_mission(date);
CREATE INDEX idx_mission_student_date ON daily_mission(student_id, date);
CREATE INDEX idx_mission_plan ON daily_mission(plan_id);

-- mission_result
CREATE INDEX idx_result_mission ON mission_result(mission_id);
CREATE INDEX idx_result_student ON mission_result(student_id);
CREATE INDEX idx_result_date ON mission_result(completed_date);

-- lesson
CREATE INDEX idx_lesson_grade ON lesson(grade);
CREATE INDEX idx_lesson_active ON lesson(is_active);

-- student_lesson
CREATE INDEX idx_student_lesson_student ON student_lesson(student_id);
CREATE INDEX idx_student_lesson_lesson ON student_lesson(lesson_id);
```

---

## SQL 스키마

```sql
-- ================================================================
-- GB Planner Database Schema
-- Created: 2024-12-17
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table: student
-- ----------------------------
DROP TABLE IF EXISTS `student`;
CREATE TABLE `student` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_code` VARCHAR(20) NOT NULL UNIQUE COMMENT '학생 코드 (ST00001)',
  `year` INT NOT NULL COMMENT '년도',
  `school_level` ENUM('elementary', 'middle', 'high') NOT NULL COMMENT '초/중/고',
  `school_name` VARCHAR(50) DEFAULT NULL COMMENT '학교명',
  `grade` VARCHAR(10) DEFAULT NULL COMMENT '학년 (H1, H2, H3)',
  `name` VARCHAR(50) NOT NULL COMMENT '학생명',
  `school_type` ENUM('general', 'special', 'autonomous', 'foreign', 'science', 'art') DEFAULT NULL COMMENT '학교 타입',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '학생 연락처',
  `parent_phone` VARCHAR(20) DEFAULT NULL COMMENT '학부모 연락처',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '학생 이메일',
  `parent_email` VARCHAR(100) DEFAULT NULL COMMENT '학부모 이메일',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_student_code` (`student_code`),
  INDEX `idx_student_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 인적사항';

-- ----------------------------
-- Table: weekly_routine
-- ----------------------------
DROP TABLE IF EXISTS `weekly_routine`;
CREATE TABLE `weekly_routine` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `routine_code` VARCHAR(20) DEFAULT NULL UNIQUE COMMENT '루틴 코드',
  `student_id` BIGINT NOT NULL COMMENT '학생 ID',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '루틴 제목',
  `category` ENUM('study', 'exercise', 'activity', 'rest', 'other') DEFAULT NULL COMMENT '대분류',
  `sub_category` VARCHAR(50) DEFAULT NULL COMMENT '세부 분류 (학원수업, 수행, 자습)',
  `subject` VARCHAR(50) DEFAULT NULL COMMENT '과목',
  `content` VARCHAR(200) DEFAULT NULL COMMENT '내용',
  `start_time` TIME DEFAULT NULL COMMENT '시작 시간',
  `end_time` TIME DEFAULT NULL COMMENT '끝 시간',
  `day_mon` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '월요일',
  `day_tue` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '화요일',
  `day_wed` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '수요일',
  `day_thu` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '목요일',
  `day_fri` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '금요일',
  `day_sat` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '토요일',
  `day_sun` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '일요일',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 여부',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_routine_student` (`student_id`),
  INDEX `idx_routine_active` (`is_active`),
  CONSTRAINT `fk_routine_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주간 루틴';

-- ----------------------------
-- Table: long_term_plan
-- ----------------------------
DROP TABLE IF EXISTS `long_term_plan`;
CREATE TABLE `long_term_plan` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `plan_code` VARCHAR(20) DEFAULT NULL UNIQUE COMMENT '계획 코드',
  `student_id` BIGINT NOT NULL COMMENT '학생 ID',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '계획 제목',
  `category` ENUM('study', 'exercise', 'activity', 'rest', 'other') DEFAULT NULL COMMENT '대분류',
  `sub_category` VARCHAR(50) DEFAULT NULL COMMENT '세부 분류',
  `subject` VARCHAR(50) DEFAULT NULL COMMENT '과목',
  `content` VARCHAR(200) DEFAULT NULL COMMENT '내용',
  `start_date` DATE DEFAULT NULL COMMENT '시작 날짜',
  `end_date` DATE DEFAULT NULL COMMENT '끝 날짜',
  `material_type` ENUM('textbook', 'lecture') DEFAULT NULL COMMENT '교재/강의 타입',
  `material_name` VARCHAR(100) DEFAULT NULL COMMENT '교재/강의명',
  `total_pages` INT DEFAULT NULL COMMENT '전체 분량',
  `done_pages` INT NOT NULL DEFAULT 0 COMMENT '완료 분량',
  `is_distributed` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '일정 분배 여부',
  `is_completed` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '완료 여부',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_plan_student` (`student_id`),
  INDEX `idx_plan_date` (`start_date`, `end_date`),
  INDEX `idx_plan_subject` (`subject`),
  CONSTRAINT `fk_plan_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장기 계획';

-- ----------------------------
-- Table: daily_mission
-- ----------------------------
DROP TABLE IF EXISTS `daily_mission`;
CREATE TABLE `daily_mission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `mission_code` VARCHAR(30) NOT NULL UNIQUE COMMENT '미션 코드',
  `student_id` BIGINT NOT NULL COMMENT '학생 ID',
  `plan_id` BIGINT DEFAULT NULL COMMENT '연결된 장기계획 ID',
  `routine_id` BIGINT DEFAULT NULL COMMENT '연결된 루틴 ID',
  `date` DATE NOT NULL COMMENT '날짜',
  `start_time` TIME DEFAULT NULL COMMENT '시작 시간',
  `end_time` TIME DEFAULT NULL COMMENT '끝 시간',
  `category` ENUM('study', 'exercise', 'activity', 'rest', 'other') DEFAULT NULL COMMENT '분류',
  `subject` VARCHAR(50) DEFAULT NULL COMMENT '과목',
  `sub_category` VARCHAR(50) DEFAULT NULL COMMENT '세부 분류',
  `content` VARCHAR(200) DEFAULT NULL COMMENT '내용',
  `start_page` INT DEFAULT NULL COMMENT '시작 페이지',
  `end_page` INT DEFAULT NULL COMMENT '끝 페이지',
  `amount` INT DEFAULT NULL COMMENT '분량',
  `status` ENUM('pending', 'fixed', 'changed', 'added', 'deleted', 'completed') NOT NULL DEFAULT 'pending' COMMENT '상태',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_mission_student` (`student_id`),
  INDEX `idx_mission_date` (`date`),
  INDEX `idx_mission_student_date` (`student_id`, `date`),
  INDEX `idx_mission_plan` (`plan_id`),
  CONSTRAINT `fk_mission_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mission_plan` FOREIGN KEY (`plan_id`) REFERENCES `long_term_plan` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mission_routine` FOREIGN KEY (`routine_id`) REFERENCES `weekly_routine` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일일 미션 (단기 계획)';

-- ----------------------------
-- Table: mission_result
-- ----------------------------
DROP TABLE IF EXISTS `mission_result`;
CREATE TABLE `mission_result` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `result_code` VARCHAR(30) DEFAULT NULL UNIQUE COMMENT '결과 코드',
  `mission_id` BIGINT NOT NULL COMMENT '미션 ID',
  `student_id` BIGINT NOT NULL COMMENT '학생 ID',
  `completed_date` DATE DEFAULT NULL COMMENT '완료 날짜',
  `start_time` TIME DEFAULT NULL COMMENT '실제 시작 시간',
  `end_time` TIME DEFAULT NULL COMMENT '실제 끝 시간',
  `amount` INT DEFAULT NULL COMMENT '완료 분량',
  `achievement_rate` DECIMAL(3,2) DEFAULT NULL COMMENT '성취율 (0.00~1.00)',
  `correct_count` INT DEFAULT NULL COMMENT '맞은 문항 수',
  `total_questions` INT DEFAULT NULL COMMENT '전체 문항 수',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '점수',
  `focus_rate` DECIMAL(3,2) DEFAULT NULL COMMENT '몰입도 (0.00~1.00)',
  `note` TEXT DEFAULT NULL COMMENT '비고',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_result_mission` (`mission_id`),
  INDEX `idx_result_student` (`student_id`),
  INDEX `idx_result_date` (`completed_date`),
  CONSTRAINT `fk_result_mission` FOREIGN KEY (`mission_id`) REFERENCES `daily_mission` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_result_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='미션 결과';

-- ----------------------------
-- Table: lesson
-- ----------------------------
DROP TABLE IF EXISTS `lesson`;
CREATE TABLE `lesson` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lesson_code` VARCHAR(30) DEFAULT NULL UNIQUE COMMENT '수업 코드',
  `grade` VARCHAR(10) DEFAULT NULL COMMENT '학년 코드',
  `subject_code` VARCHAR(10) DEFAULT NULL COMMENT '과목 코드',
  `start_date` DATE DEFAULT NULL COMMENT '수업 시작 날짜',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '수업명',
  `teacher_name` VARCHAR(50) DEFAULT NULL COMMENT '선생님명',
  `weekly_count` INT DEFAULT NULL COMMENT '주당 수업 회수',
  `duration` VARCHAR(10) DEFAULT NULL COMMENT '1회 수업 시간',
  `schedule` JSON DEFAULT NULL COMMENT '수업 일정',
  `price` INT DEFAULT NULL COMMENT '수업료',
  `price_type` ENUM('monthly', 'per_session') DEFAULT NULL COMMENT '수업료 기준',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 여부',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_lesson_grade` (`grade`),
  INDEX `idx_lesson_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수업';

-- ----------------------------
-- Table: mentoring
-- ----------------------------
DROP TABLE IF EXISTS `mentoring`;
CREATE TABLE `mentoring` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `mentoring_code` VARCHAR(30) DEFAULT NULL UNIQUE COMMENT '멘토링 코드',
  `grade` VARCHAR(10) DEFAULT NULL COMMENT '학년 코드',
  `subject_code` VARCHAR(10) DEFAULT NULL COMMENT '과목 코드',
  `start_date` DATE DEFAULT NULL COMMENT '시작 날짜',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '멘토링명',
  `mentor_name` VARCHAR(50) DEFAULT NULL COMMENT '멘토명',
  `weekly_count` INT DEFAULT NULL COMMENT '주당 회수',
  `duration` VARCHAR(10) DEFAULT NULL COMMENT '1회 시간',
  `schedule` JSON DEFAULT NULL COMMENT '일정',
  `price` INT DEFAULT NULL COMMENT '요금',
  `price_type` ENUM('monthly', 'per_session') DEFAULT NULL COMMENT '요금 기준',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 여부',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='멘토링';

-- ----------------------------
-- Table: student_lesson (학생-수업 연결)
-- ----------------------------
DROP TABLE IF EXISTS `student_lesson`;
CREATE TABLE `student_lesson` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL,
  `lesson_id` BIGINT NOT NULL,
  `enrolled_at` DATE DEFAULT NULL COMMENT '등록일',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_lesson` (`student_id`, `lesson_id`),
  INDEX `idx_student_lesson_student` (`student_id`),
  INDEX `idx_student_lesson_lesson` (`lesson_id`),
  CONSTRAINT `fk_sl_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sl_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lesson` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생-수업 연결';

-- ----------------------------
-- Table: student_mentoring (학생-멘토링 연결)
-- ----------------------------
DROP TABLE IF EXISTS `student_mentoring`;
CREATE TABLE `student_mentoring` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL,
  `mentoring_id` BIGINT NOT NULL,
  `enrolled_at` DATE DEFAULT NULL COMMENT '등록일',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_mentoring` (`student_id`, `mentoring_id`),
  INDEX `idx_sm_student` (`student_id`),
  INDEX `idx_sm_mentoring` (`mentoring_id`),
  CONSTRAINT `fk_sm_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sm_mentoring` FOREIGN KEY (`mentoring_id`) REFERENCES `mentoring` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생-멘토링 연결';

SET FOREIGN_KEY_CHECKS = 1;
```

---

## 데이터 관계 요약

```
학생(student)
  ├── 주간루틴(weekly_routine) [1:N]
  ├── 장기계획(long_term_plan) [1:N]
  ├── 일일미션(daily_mission) [1:N]
  ├── 미션결과(mission_result) [1:N]
  ├── 수업수강(student_lesson) [N:M with lesson]
  └── 멘토링수강(student_mentoring) [N:M with mentoring]

장기계획(long_term_plan)
  └── 일일미션(daily_mission) [1:N] - 계획을 일별로 분배

주간루틴(weekly_routine)
  └── 일일미션(daily_mission) [1:N] - 루틴에서 생성된 미션

일일미션(daily_mission)
  └── 미션결과(mission_result) [1:1 or 1:N] - 미션 수행 결과
```

---

## 샘플 쿼리

### 특정 학생의 오늘 미션 조회

```sql
SELECT
  dm.*,
  lp.title as plan_title,
  wr.title as routine_title
FROM daily_mission dm
LEFT JOIN long_term_plan lp ON dm.plan_id = lp.id
LEFT JOIN weekly_routine wr ON dm.routine_id = wr.id
WHERE dm.student_id = 1
  AND dm.date = CURDATE()
ORDER BY dm.start_time;
```

### 학생의 주간 성취 현황

```sql
SELECT
  DATE(dm.date) as date,
  COUNT(*) as total_missions,
  SUM(CASE WHEN mr.id IS NOT NULL THEN 1 ELSE 0 END) as completed_missions,
  AVG(mr.achievement_rate) as avg_achievement
FROM daily_mission dm
LEFT JOIN mission_result mr ON dm.id = mr.mission_id
WHERE dm.student_id = 1
  AND dm.date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
GROUP BY DATE(dm.date)
ORDER BY date;
```

### 과목별 학습 현황

```sql
SELECT
  dm.subject,
  COUNT(*) as total_missions,
  SUM(CASE WHEN mr.id IS NOT NULL THEN 1 ELSE 0 END) as completed,
  AVG(mr.score) as avg_score
FROM daily_mission dm
LEFT JOIN mission_result mr ON dm.id = mr.mission_id
WHERE dm.student_id = 1
  AND dm.category = 'study'
GROUP BY dm.subject
ORDER BY total_missions DESC;
```
