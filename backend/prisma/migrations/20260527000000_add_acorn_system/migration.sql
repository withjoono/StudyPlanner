-- CreateTable: 도토리 잔액
CREATE TABLE "sp_acorn_balance" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetime" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sp_acorn_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable: 도토리 거래 내역
CREATE TABLE "sp_acorn_transaction" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "description" VARCHAR(200),
    "reference_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sp_acorn_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sp_acorn_balance_student_id_key" ON "sp_acorn_balance"("student_id");

-- CreateIndex
CREATE INDEX "idx_acorn_student" ON "sp_acorn_transaction"("student_id");

-- CreateIndex
CREATE INDEX "idx_acorn_type" ON "sp_acorn_transaction"("type");

-- CreateIndex
CREATE INDEX "idx_acorn_timeline" ON "sp_acorn_transaction"("student_id", "created_at");

-- AddForeignKey
ALTER TABLE "sp_acorn_balance" ADD CONSTRAINT "sp_acorn_balance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sp_acorn_transaction" ADD CONSTRAINT "sp_acorn_transaction_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
