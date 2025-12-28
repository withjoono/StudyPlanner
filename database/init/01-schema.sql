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


















