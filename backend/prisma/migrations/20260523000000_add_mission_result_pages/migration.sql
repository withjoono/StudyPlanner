-- AlterTable: 미션 결과에 실제 학습 페이지 범위(start/end) 컬럼 추가
ALTER TABLE "mission_result" ADD COLUMN "start_page" INTEGER,
ADD COLUMN "end_page" INTEGER;
