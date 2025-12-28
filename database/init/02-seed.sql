-- ================================================================
-- GB Planner Sample Data
-- Created: 2024-12-17
-- ================================================================

SET NAMES utf8mb4;

-- ----------------------------
-- Sample: student
-- ----------------------------
INSERT INTO `student` (`student_code`, `year`, `school_level`, `school_name`, `grade`, `name`, `school_type`, `phone`, `parent_phone`, `email`) VALUES
('ST00001', 2025, 'high', '서울고등학교', 'H1', '김민준', 'general', '010-1234-5678', '010-8765-4321', 'minjun@example.com'),
('ST00002', 2025, 'high', '한국외국어고등학교', 'H2', '이서연', 'foreign', '010-2345-6789', '010-9876-5432', 'seoyeon@example.com'),
('ST00003', 2025, 'middle', '강남중학교', 'M3', '박지훈', NULL, '010-3456-7890', '010-0987-6543', NULL);

-- ----------------------------
-- Sample: weekly_routine
-- ----------------------------
INSERT INTO `weekly_routine` (`routine_code`, `student_id`, `title`, `category`, `sub_category`, `subject`, `content`, `start_time`, `end_time`, `day_mon`, `day_tue`, `day_wed`, `day_thu`, `day_fri`) VALUES
('R001', 1, '수학 학원', 'study', '학원수업', '수학', '정규반 수업', '18:00:00', '21:00:00', TRUE, FALSE, TRUE, FALSE, TRUE),
('R002', 1, '영어 학원', 'study', '학원수업', '영어', '정규반 수업', '18:00:00', '20:00:00', FALSE, TRUE, FALSE, TRUE, FALSE),
('R003', 1, '아침 운동', 'exercise', '운동', NULL, '조깅 30분', '06:30:00', '07:00:00', TRUE, TRUE, TRUE, TRUE, TRUE),
('R004', 2, '국어 과외', 'study', '과외', '국어', '1:1 과외', '19:00:00', '21:00:00', FALSE, FALSE, TRUE, FALSE, FALSE),
('R005', 2, '수학 자습', 'study', '자습', '수학', '문제집 풀이', '21:00:00', '23:00:00', TRUE, TRUE, TRUE, TRUE, TRUE);

-- ----------------------------
-- Sample: long_term_plan
-- ----------------------------
INSERT INTO `long_term_plan` (`plan_code`, `student_id`, `title`, `category`, `sub_category`, `subject`, `content`, `start_date`, `end_date`, `material_type`, `material_name`, `total_pages`, `done_pages`) VALUES
('LP001', 1, '수학의 정석 완독', 'study', '자습', '수학', '기본편 완독 목표', '2025-01-01', '2025-03-31', 'textbook', '수학의 정석 기본편', 500, 120),
('LP002', 1, '영어 단어장', 'study', '자습', '영어', '수능 영단어 암기', '2025-01-01', '2025-06-30', 'textbook', '워드마스터 수능편', 300, 80),
('LP003', 2, 'EBS 수능특강', 'study', '인강', '국어', 'EBS 국어 강의 수강', '2025-01-15', '2025-04-30', 'lecture', 'EBS 수능특강 국어', 50, 15),
('LP004', 1, '물리 기본 개념', 'study', '자습', '과학', '물리학1 개념 정리', '2025-02-01', '2025-05-31', 'textbook', '물리학1 개념서', 400, 0);

-- ----------------------------
-- Sample: daily_mission
-- ----------------------------
INSERT INTO `daily_mission` (`mission_code`, `student_id`, `plan_id`, `routine_id`, `date`, `start_time`, `end_time`, `category`, `subject`, `sub_category`, `content`, `start_page`, `end_page`, `amount`, `status`) VALUES
('ST00001P25011701', 1, 1, NULL, '2025-01-17', '21:00:00', '22:30:00', 'study', '수학', '자습', '수학의 정석 p.121-130', 121, 130, 10, 'pending'),
('ST00001P25011702', 1, 2, NULL, '2025-01-17', '22:30:00', '23:00:00', 'study', '영어', '자습', '영단어 Day 25 암기', NULL, NULL, 50, 'pending'),
('ST00001R25011701', 1, NULL, 1, '2025-01-17', '18:00:00', '21:00:00', 'study', '수학', '학원수업', '수학 학원 수업', NULL, NULL, NULL, 'fixed'),
('ST00001R25011702', 1, NULL, 3, '2025-01-17', '06:30:00', '07:00:00', 'exercise', NULL, '운동', '아침 조깅', NULL, NULL, NULL, 'completed'),
('ST00002P25011701', 2, 3, NULL, '2025-01-17', '21:00:00', '22:00:00', 'study', '국어', '인강', 'EBS 수능특강 16강', NULL, NULL, 1, 'pending');

-- ----------------------------
-- Sample: mission_result
-- ----------------------------
INSERT INTO `mission_result` (`result_code`, `mission_id`, `student_id`, `completed_date`, `start_time`, `end_time`, `amount`, `achievement_rate`, `focus_rate`, `note`) VALUES
('ST00001O25011701', 4, 1, '2025-01-17', '06:35:00', '07:05:00', NULL, 1.00, 0.90, '컨디션 좋음');

-- ----------------------------
-- Sample: lesson
-- ----------------------------
INSERT INTO `lesson` (`lesson_code`, `grade`, `subject_code`, `start_date`, `name`, `teacher_name`, `weekly_count`, `duration`, `schedule`, `price`, `price_type`) VALUES
('CK10S0125011701', 'H1', 'S01', '2025-01-01', '고1 수학 정규반', '김수학', 3, '3H', '[{"day": "mon", "start_time": "18:00", "end_time": "21:00"}, {"day": "wed", "start_time": "18:00", "end_time": "21:00"}, {"day": "fri", "start_time": "18:00", "end_time": "21:00"}]', 450000, 'monthly'),
('CK10E0125011701', 'H1', 'E01', '2025-01-01', '고1 영어 정규반', '박영어', 2, '2H', '[{"day": "tue", "start_time": "18:00", "end_time": "20:00"}, {"day": "thu", "start_time": "18:00", "end_time": "20:00"}]', 300000, 'monthly');

-- ----------------------------
-- Sample: mentoring
-- ----------------------------
INSERT INTO `mentoring` (`mentoring_code`, `grade`, `subject_code`, `start_date`, `name`, `mentor_name`, `weekly_count`, `duration`, `schedule`, `price`, `price_type`) VALUES
('MK10A0125011701', 'H1', 'A01', '2025-01-15', '고1 학습 멘토링', '이멘토', 1, '1H', '[{"day": "sat", "start_time": "14:00", "end_time": "15:00"}]', 80000, 'monthly');

-- ----------------------------
-- Sample: student_lesson
-- ----------------------------
INSERT INTO `student_lesson` (`student_id`, `lesson_id`, `enrolled_at`) VALUES
(1, 1, '2025-01-01'),
(1, 2, '2025-01-01');

-- ----------------------------
-- Sample: student_mentoring
-- ----------------------------
INSERT INTO `student_mentoring` (`student_id`, `mentoring_id`, `enrolled_at`) VALUES
(1, 1, '2025-01-15');


















