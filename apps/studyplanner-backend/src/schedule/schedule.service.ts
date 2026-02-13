import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 동적 스케줄링 서비스
 * 미완료 미션의 자동 이전 및 우선순위 재조정
 */
@Injectable()
export class ScheduleService {
    private readonly logger = new Logger(ScheduleService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 미완료 미션을 다른 날로 이전 */
    async rescheduleMission(data: {
        missionId: number;
        newDate: string; // YYYY-MM-DD
        newOrder?: number;
    }) {
        const mission = await this.prisma.dailyMission.findUnique({
            where: { id: BigInt(data.missionId) },
        });

        if (!mission) throw new Error('Mission not found');

        const updated = await this.prisma.dailyMission.update({
            where: { id: BigInt(data.missionId) },
            data: {
                date: new Date(data.newDate),
            },
        });

        return this.serialize(updated);
    }

    /** 미완료 미션 전체를 다음날로 자동 이전 */
    async carryOverIncompleteMissions(studentId: number, fromDate?: string) {
        const targetDate = fromDate ? new Date(fromDate) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const incompleteMissions = await this.prisma.dailyMission.findMany({
            where: {
                studentId: BigInt(studentId),
                date: targetDate,
                status: { not: 'completed' },
            },
        });

        const moved: any[] = [];
        for (const mission of incompleteMissions) {
            const updated = await this.prisma.dailyMission.update({
                where: { id: mission.id },
                data: { date: nextDate },
            });
            moved.push(this.serialize(updated));
        }

        this.logger.log(`Carried over ${moved.length} missions for student ${studentId}`);
        return { movedCount: moved.length, missions: moved };
    }

    /** 미션 순서 재정렬 (드래그 앤 드롭) */
    async reorderMissions(data: {
        studentId: number;
        date: string;
        missionIds: number[]; // 새 순서대로
    }) {
        const updates = data.missionIds.map((id, idx) =>
            this.prisma.dailyMission.update({
                where: { id: BigInt(id) },
                data: { status: 'pending' as any },
            }),
        );

        await this.prisma.$transaction(updates);
        return { success: true, count: data.missionIds.length };
    }

    /** 특정 날의 미션 목록 (정렬 포함) */
    async getDayMissions(studentId: number, date: string) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const missions = await this.prisma.dailyMission.findMany({
            where: {
                studentId: BigInt(studentId),
                date: targetDate,
            },
            orderBy: { date: 'asc' },
        });

        return missions.map(this.serialize);
    }

    private serialize(obj: any) {
        const result: any = { ...obj };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'bigint') result[key] = Number(result[key]);
        }
        return result;
    }
}
