import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationPayload {
    studentId: number;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}

/**
 * 알림 서비스
 * - 학습 리마인더 (오늘 미완료 미션)
 * - 스트릭 경고 (연속 학습 끊어질 위험)
 * - 성적 변화 알림
 * - 퀴즈 생성 알림
 */
@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 학습 리마인더 생성 */
    async createStudyReminder(studentId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingMissions = await this.prisma.dailyMission.count({
            where: {
                studentId: BigInt(studentId),
                date: today,
                status: 'pending',
            },
        });

        if (pendingMissions === 0) return null;

        return this.createNotification({
            studentId,
            type: 'study_reminder',
            title: '📚 오늘의 학습 미션',
            body: `아직 ${pendingMissions}개의 미션이 남아있어요! 지금 시작해볼까요?`,
            data: { pendingCount: pendingMissions },
        });
    }

    /** 스트릭 경고 */
    async createStreakWarning(studentId: number, currentStreak: number) {
        if (currentStreak < 3) return null;

        return this.createNotification({
            studentId,
            type: 'streak_warning',
            title: '🔥 스트릭을 지켜주세요!',
            body: `${currentStreak}일 연속 학습 중! 오늘도 학습하면 기록이 이어져요.`,
            data: { streak: currentStreak },
        });
    }

    /** 성적 변화 알림 */
    async createScoreChangeNotification(
        studentId: number,
        subject: string,
        previousGrade: number,
        currentGrade: number,
    ) {
        const improvement = previousGrade - currentGrade;

        if (improvement > 0) {
            return this.createNotification({
                studentId,
                type: 'score_improvement',
                title: '🎉 성적 향상!',
                body: `${subject} 등급이 ${previousGrade}등급에서 ${currentGrade}등급으로 올랐어요!`,
                data: { subject, improvement },
            });
        } else if (improvement < 0) {
            return this.createNotification({
                studentId,
                type: 'score_decline',
                title: `📈 ${subject} 성적 알림`,
                body: `${subject} 성적이 변동되었어요. 학습 전략을 점검해볼까요?`,
                data: { subject, change: improvement },
            });
        }

        return null;
    }

    /** 알림 목록 조회 */
    async getNotifications(studentId: number, limit: number = 20) {
        // 인메모리 또는 DB 기반 — Phase 4에서는 간단한 인메모리 Queue
        // 향후 FCM/APNs 연동 가능
        return {
            studentId,
            notifications: [],
            message: 'DB 미 연결 상태. 알림 모델 추가 후 활성화됩니다.',
        };
    }

    /** 알림 읽음 처리 */
    async markAsRead(notificationId: number) {
        return { id: notificationId, read: true };
    }

    private async createNotification(payload: NotificationPayload) {
        this.logger.log(`[${payload.type}] ${payload.title} → Student ${payload.studentId}`);

        // 향후 DB 저장 + FCM 전송
        return {
            id: Date.now(),
            ...payload,
            createdAt: new Date(),
            read: false,
        };
    }
}
