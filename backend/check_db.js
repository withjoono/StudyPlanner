const { PrismaClient } = require('@prisma/client');

// Use the same URL as app.yaml but with direct IP
const db = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://tsuser:tsuser1234@34.64.165.158:5432/geobukschool_prod?schema=studyplanner,hub' }
  }
});

async function main() {
  try {
    // Check hub schema tables
    const hubTables = await db.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'hub' ORDER BY table_name"
    );
    console.log('Tables in hub schema:', JSON.stringify(hubTables));

    // Try dailyMission query (same as getAllMissions)
    try {
      const missions = await db.dailyMission.findMany({
        where: { studentId: BigInt(1) },
        include: {
          missionResults: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
      console.log('Missions found:', missions.length);
    } catch (e) {
      console.error('findMany ERROR:', e.message);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await db.$disconnect();
  }
}
main();
