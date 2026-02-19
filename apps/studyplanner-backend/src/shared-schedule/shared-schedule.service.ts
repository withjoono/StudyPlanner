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

  /**
   * 주간 루틴을 공유 스케줄에 동기화
   */
  async syncRoutine(routine: {
    id: bigint;
    studentId: bigint;
    title?: string | null;
    subject?: string | null;
    startTime?: Date | null;
    endTime?: Date | null;
    isActive?: boolean;
  }) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: routine.studentId },
        include: { user: true },
      });

      if (!student?.user?.hubUserId) {
        this.logger.warn(`Student ${routine.studentId} has no hubUserId, skipping routine sync`);
        return;
      }

      // 주간 루틴은 매주 반복되므로 현재 주 기준 날짜 사용
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      await this.prisma.hubSharedSchedule.upsert({
        where: {
          uk_hub_schedule_source: {
            sourceApp: 'studyplanner',
            eventType: 'routine',
            sourceId: String(routine.id),
          },
        },
        create: {
          hubUserId: student.user.hubUserId,
          sourceApp: 'studyplanner',
          eventType: 'routine',
          sourceId: String(routine.id),
          title: routine.title || '주간 루틴',
          eventDate: monday,
          startTime: routine.startTime,
          endTime: routine.endTime,
          subject: routine.subject,
          metadata: { isActive: routine.isActive ?? true },
        },
        update: {
          title: routine.title || '주간 루틴',
          eventDate: monday,
          startTime: routine.startTime,
          endTime: routine.endTime,
          subject: routine.subject,
          metadata: { isActive: routine.isActive ?? true },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to sync routine ${routine.id}`, error);
    }
  }

  /**
   * 장기 계획을 공유 스케줄에 동기화
   */
  async syncPlan(plan: {
    id: bigint;
    studentId: bigint;
    title?: string | null;
    subject?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    isCompleted?: boolean;
  }) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: plan.studentId },
        include: { user: true },
      });

      if (!student?.user?.hubUserId) {
        this.logger.warn(`Student ${plan.studentId} has no hubUserId, skipping plan sync`);
        return;
      }

      await this.prisma.hubSharedSchedule.upsert({
        where: {
          uk_hub_schedule_source: {
            sourceApp: 'studyplanner',
            eventType: 'plan',
            sourceId: String(plan.id),
          },
        },
        create: {
          hubUserId: student.user.hubUserId,
          sourceApp: 'studyplanner',
          eventType: 'plan',
          sourceId: String(plan.id),
          title: plan.title || '장기 계획',
          eventDate: plan.startDate || new Date(),
          subject: plan.subject,
          metadata: {
            endDate: plan.endDate?.toISOString(),
            isCompleted: plan.isCompleted ?? false,
          },
        },
        update: {
          title: plan.title || '장기 계획',
          eventDate: plan.startDate || new Date(),
          subject: plan.subject,
          metadata: {
            endDate: plan.endDate?.toISOString(),
            isCompleted: plan.isCompleted ?? false,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to sync plan ${plan.id}`, error);
    }
  }

  /**
   * 소스 타입+ID로 공유 스케줄에서 삭제 (루틴/계획 삭제 시 사용)
   */
  async removeScheduleBySource(eventType: string, sourceId: string) {
    try {
      await this.prisma.hubSharedSchedule.deleteMany({
        where: {
          sourceApp: 'studyplanner',
          eventType,
          sourceId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to remove ${eventType}/${sourceId} from shared schedule`, error);
    }
  }
}
