/**
 * 교과/과목 데이터 시딩 스크립트
 * Excel 파일에서 데이터를 읽어 sp_2015_kyokwa_subject, sp_2022_kyokwa_subject 테이블에 입력
 *
 * Usage: node prisma/seed-kyokwa.js
 */
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function seedTable(model, filePath, columnMap) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`Reading ${filePath}: ${rows.length} rows`);

  // Clear existing data
  await model.deleteMany();

  // Insert rows
  let inserted = 0;
  for (const row of rows) {
    try {
      await model.create({
        data: {
          id: String(row[columnMap.id]),
          kyokwa: String(row[columnMap.kyokwa]),
          kyokwaCode: String(row[columnMap.kyokwaCode]),
          classification: String(row[columnMap.classification]),
          classificationCode: Number(row[columnMap.classificationCode]),
          subjectName: String(row[columnMap.subjectName]),
          subjectCode: Number(row[columnMap.subjectCode]),
          evaluationMethod: row[columnMap.evaluationMethod]
            ? String(row[columnMap.evaluationMethod])
            : null,
        },
      });
      inserted++;
    } catch (e) {
      console.error(`  Error inserting row ${row[columnMap.id]}:`, e.message);
    }
  }

  console.log(`  Inserted: ${inserted}/${rows.length}`);
}

async function main() {
  try {
    // 2015 교육과정
    console.log('\n=== Seeding sp_2015_kyokwa_subject ===');
    await seedTable(
      prisma.sp2015KyokwaSubject,
      path.join(__dirname, '..', 'upload', 'sp_2015_kyokwa_subject.xlsx'),
      {
        id: 'ID',
        kyokwa: '교과',
        kyokwaCode: '교과코드',
        classification: '종류',
        classificationCode: '종류코드',
        subjectName: '과목',
        subjectCode: '과목코드',
        evaluationMethod: '석차등급,성취',
      },
    );

    // 2022 교육과정
    console.log('\n=== Seeding sp_2022_kyokwa_subject ===');
    await seedTable(
      prisma.sp2022KyokwaSubject,
      path.join(__dirname, '..', 'upload', 'sp_2022_kyokwa_subject.xlsx'),
      {
        id: 'ID',
        kyokwa: '교과',
        kyokwaCode: '교과코드',
        classification: '과목분류',
        classificationCode: '과목분류코드',
        subjectName: '과목',
        subjectCode: '과목코드',
        evaluationMethod: '평가방법',
      },
    );

    console.log('\nDone!');
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
