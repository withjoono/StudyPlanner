import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class SharedScheduleService {
  private readonly logger = new Logger(SharedScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 미션을 공유 스케줄에 동기화
   */
  async syncMission(mission: {
    id: bigint;
    studentId: bigint;
    date: Date;
    content?: string | null;
    subject?: string | null;
    startTime?: Date | null;
    endTime?: Date | null;
    status?: string;
  }) {
    try {
      // studentId로 hubUserId 조회
      const student = await this.prisma.student.findUnique({
        where: { id: mission.studentId },
        include: { user: true },
      });

      if (!student?.user?.hubUserId) {
        this.logger.warn(`Student ${mission.studentId} has no hubUserId, skipping sync`);
        return;
      }

      await this.prisma.hubSharedSchedule.upsert({
        where: {
          uk_hub_schedule_source: {
            sourceApp: 'studyplanner',
            eventType: 'mission',
            sourceId: String(mission.id),
          },
        },
        create: {
          hubUserId: student.user.hubUserId,
          sourceApp: 'studyplanner',
          eventType: 'mission',
          sourceId: String(mission.id),
          title: mission.content || '미션',
          eventDate: mission.date,
          startTime: mission.startTime,
          endTime: mission.endTime,
          subject: mission.subject,
          metadata: { status: mission.status || 'pending' },
        },
        update: {
          title: mission.content || '미션',
          eventDate: mission.date,
          startTime: mission.startTime,
          endTime: mission.endTime,
          subject: mission.subject,
          metadata: { status: mission.status || 'pending' },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to sync mission ${mission.id}`, error);
    }
  }

  /**
   * 공유 스케줄에서 미션 삭제
   */
  async removeMission(missionId: bigint) {
    try {
      await this.prisma.hubSharedSchedule.deleteMany({
        where: {
          sourceApp: 'studyplanner',
          eventType: 'mission',
          sourceId: String(missionId),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to remove mission ${missionId} from shared schedule`, error);
    }
  }

  /**
   * 사용자의 통합 스케줄 조회 (StudyPlanner + TutorBoard)
   */
  async getMySchedule(hubUserId: string, startDate: string, endDate: string) {
    const events = await this.prisma.hubSharedSchedule.findMany({
      where: {
        hubUserId,
        eventDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
    });

    return events.map((e) => ({
      id: Number(e.id),
      sourceApp: e.sourceApp,
      eventType: e.eventType,
      sourceId: e.sourceId,
      title: e.title,
      description: e.description,
      eventDate: e.eventDate,
      startTime: e.startTime,
      endTime: e.endTime,
      subject: e.subject,
      metadata: e.metadata,
    }));
  }
}
