import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 사진 인증 & AI 검증 서비스
 * 학습 수행의 진위 여부를 판별
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사진 인증 업로드 및 검증
   * Phase 1: 사진 메타데이터 저장 및 기본 검증 (AI stub)
   * Phase 2: AI OCR 분석 (텍스트 밀도, 문제 유형 등)
   */
  async submitVerification(data: {
    studentId: number;
    missionId: number;
    photoUrl: string;
    reportedPages: number;
  }) {
    // MissionResult 찾기 (해당 미션의 결과)
    let missionResult = await this.prisma.missionResult.findFirst({
      where: { missionId: BigInt(data.missionId) },
    });

    // 결과가 없으면 자동 생성
    if (!missionResult) {
      missionResult = await this.prisma.missionResult.create({
        data: {
          missionId: BigInt(data.missionId),
          studentId: BigInt(data.studentId),
          completedDate: new Date(),
          amount: data.reportedPages,
        },
      });
    }

    // Phase 1: AI score는 stub (항상 1.0)
    const aiScore = 1.0;

    const photo = await this.prisma.verificationPhoto.create({
      data: {
        missionResultId: missionResult.id,
        photoUrl: data.photoUrl,
        verifiedAt: new Date(),
        aiScore,
        pageCount: data.reportedPages,
        aiAnalysis: { verified: true, stub: true, confidence: 1.0 },
      },
    });

    // MissionResult score에 반영
    await this.prisma.missionResult.update({
      where: { id: missionResult.id },
      data: { score: aiScore },
    });

    this.logger.log(
      `Verification photo uploaded: student=${data.studentId}, mission=${data.missionId}, pages=${data.reportedPages}`,
    );

    return this.serialize(photo);
  }

  /**
   * 미션 결과의 인증 사진 목록 조회
   */
  async getVerifications(missionId: number) {
    const missionResult = await this.prisma.missionResult.findFirst({
      where: { missionId: BigInt(missionId) },
    });

    if (!missionResult) {
      return [];
    }

    const photos = await this.prisma.verificationPhoto.findMany({
      where: { missionResultId: missionResult.id },
      orderBy: { createdAt: 'desc' },
    });

    return photos.map(this.serialize);
  }

  /**
   * 학생의 인증 통계
   */
  async getVerificationStats(studentId: number) {
    const results = await this.prisma.missionResult.findMany({
      where: { studentId: BigInt(studentId) },
      include: { verificationPhotos: true },
    });

    const allPhotos = results.flatMap((r) => r.verificationPhotos);

    return {
      totalVerifications: allPhotos.length,
      averageAiScore:
        allPhotos.length > 0
          ? Math.round(
              (allPhotos.reduce((sum, p) => sum + Number(p.aiScore || 0), 0) /
                allPhotos.length) *
                100,
            ) / 100
          : null,
      verifiedPages: allPhotos.reduce(
        (sum, p) => sum + (p.pageCount || 0),
        0,
      ),
    };
  }

  private serialize(photo: any) {
    return {
      ...photo,
      id: Number(photo.id),
      missionResultId: Number(photo.missionResultId),
      aiScore: photo.aiScore ? Number(photo.aiScore) : null,
    };
  }
}
