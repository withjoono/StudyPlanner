import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { MaterialCategory, SubjectCode } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 교재/인강 자동완성 검색
   * 한두 글자 입력 시 관련 교재/교과서/인강을 반환
   */
  /**
   * userId가 있으면 교육과정(2015/2022)에 맞는 교재만 필터링
   * - S26H3*, S26H4*, S26H0* → 2015 교육과정 (2027대비 교재)
   * - 나머지 → 2022 교육과정 (2022 개정 교재)
   * - curriculum이 null인 교재는 모든 사용자에게 노출
   */
  async search(query: string, category?: MaterialCategory, limit = 10, userId?: string) {
    if (!query || query.length < 1) return [];

    const curriculum = userId ? this.getCurriculum(userId) : null;

    const where: any = {
      name: { contains: query, mode: 'insensitive' },
      isActive: true,
    };

    // 교육과정 필터: 해당 교육과정 교재 + 전체공통(null) 교재만
    if (curriculum) {
      where.OR = [{ curriculum: null }, { curriculum }];
    }

    if (category) {
      where.category = category;
    }

    const materials = await this.prisma.material.findMany({
      where,
      select: {
        id: true,
        category: true,
        name: true,
        publisher: true,
        author: true,
        totalPages: true,
        totalLectures: true,
        subjectCode: true,
        grade: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return materials.map((m) => ({
      id: Number(m.id),
      category: m.category,
      name: m.name,
      publisher: m.publisher,
      author: m.author,
      totalPages: m.totalPages,
      totalLectures: m.totalLectures,
      subjectCode: m.subjectCode,
      grade: m.grade,
    }));
  }

  /**
   * 교재 상세 정보 (목차 포함)
   */
  async getDetail(id: number) {
    const material = await this.prisma.material.findUnique({
      where: { id: BigInt(id) },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
          include: {
            sections: { orderBy: { sectionNumber: 'asc' } },
          },
        },
      },
    });

    if (!material) return null;

    return {
      id: Number(material.id),
      category: material.category,
      name: material.name,
      publisher: material.publisher,
      author: material.author,
      totalPages: material.totalPages,
      totalLectures: material.totalLectures,
      subjectCode: material.subjectCode,
      grade: material.grade,
      description: material.description,
      chapters: material.chapters.map((ch) => ({
        id: Number(ch.id),
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        startPage: ch.startPage,
        endPage: ch.endPage,
        sections: ch.sections.map((s) => ({
          id: Number(s.id),
          sectionNumber: s.sectionNumber,
          title: s.title,
        })),
      })),
    };
  }

  /**
   * results.json에서 참고서 데이터 일괄 임포트
   */
  async importFromJson(
    filePath?: string,
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const resolvedPath = filePath || path.join(process.cwd(), 'upload', 'results.json');

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const items: any[] = JSON.parse(raw);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        if (!item.title) {
          skipped++;
          continue;
        }

        // 중복 체크 (같은 제목)
        const existing = await this.prisma.material.findFirst({
          where: { name: item.title },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // 총 페이지 수 파싱 ("1020쪽" → 1020)
        const totalPages = item.total_pages
          ? parseInt(item.total_pages.replace(/[^0-9]/g, ''), 10) || null
          : null;

        // 과목 자동 판별
        const subjectCode = this.detectSubject(item.title);

        // 학년 자동 판별
        const grade = this.detectGrade(item.title);

        // 교육과정 판별
        const curriculum = this.detectCurriculum(item.title);

        // materialCode 생성
        const materialCode = `REF${Date.now().toString(36).toUpperCase()}${String(imported).padStart(4, '0')}`;

        // Material 저장
        const material = await this.prisma.material.create({
          data: {
            materialCode,
            category: MaterialCategory.reference,
            subjectCode,
            grade,
            name: item.title,
            totalPages,
            description: item.url || null,
            curriculum,
            isActive: true,
          },
        });

        // 목차(toc) 파싱 → chapters
        if (item.toc && item.toc !== 'Not found') {
          await this.parseTocToChapters(material.id, item.toc);
        }

        imported++;
      } catch (err) {
        errors++;
        this.logger.warn(`Import error for "${item.title}": ${err.message}`);
      }
    }

    this.logger.log(`Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
  }

  /**
   * 제목에서 과목 자동 판별
   */
  /**
   * 사용자 ID에서 교육과정 판별
   * S26H3*, S26H4*, S26H0* → '2015'
   * 나머지 → '2022'
   */
  private getCurriculum(userId: string): '2015' | '2022' {
    let idBody = userId.startsWith('sp_') ? userId.substring(3) : userId;
    if (/^[STP]/i.test(idBody)) {
      idBody = idBody.substring(1);
    }
    const prefix = idBody.substring(0, 4).toUpperCase();
    if (['26H3', '26H4', '26H0'].includes(prefix)) return '2015';
    return '2022';
  }

  /**
   * 제목에서 교육과정 판별
   * - "2027대비", "2027수능" 등 2027 포함 → '2015' (2015 교육과정 사용자용)
   * - "2022 개정 교육과정" 포함 → '2022' (2022 교육과정 사용자용)
   * - 둘 다 아닌 경우 → null (모든 사용자에게 노출)
   */
  private detectCurriculum(title: string): string | null {
    if (/2027/.test(title)) return '2015';
    if (/2022\s*개정\s*(교육)?과정/.test(title)) return '2022';
    return null;
  }

  private detectSubject(title: string): SubjectCode {
    const t = title.toLowerCase();
    if (/국어|문학|비문학|독서|화법|언어|작문/.test(t)) return SubjectCode.korean;
    if (/수학|미적분|확률|통계|기하|대수/.test(t)) return SubjectCode.math;
    if (/영어|영단어|리딩|english/.test(t)) return SubjectCode.english;
    if (/물리|화학|생명|지구|과학|통합과학/.test(t)) return SubjectCode.science;
    if (/사회|한국사|세계사|동아시아|경제|정치|윤리|지리|문화/.test(t)) return SubjectCode.social;
    if (/한국사/.test(t)) return SubjectCode.history;
    if (/제2외국어|일본어|중국어|프랑스어|독일어|스페인어|아랍어/.test(t))
      return SubjectCode.foreign;
    return SubjectCode.other;
  }

  /**
   * 제목에서 학년 자동 판별
   */
  private detectGrade(title: string): string | null {
    if (/고1|고등학교 1/.test(title)) return 'H1';
    if (/고2|고등학교 2/.test(title)) return 'H2';
    if (/고3|고등학교 3|수능|모의고사|모의평가|평가원/.test(title)) return 'H3';
    if (/중1|중학교 1/.test(title)) return 'M1';
    if (/중2|중학교 2/.test(title)) return 'M2';
    if (/중3|중학교 3/.test(title)) return 'M3';
    if (/고등|고교/.test(title)) return 'H0';
    if (/중학|중등/.test(title)) return 'M0';
    return null;
  }

  /**
   * 목차 텍스트를 챕터로 파싱하여 저장
   */
  private async parseTocToChapters(materialId: bigint, toc: string) {
    // "[목 차]" 제거 후 줄 단위 분리
    const cleaned = toc.replace(/\[목\s*차\]/g, '').replace(/\r\n/g, '\n');

    const lines = cleaned
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let chapterNumber = 0;

    for (const line of lines) {
      // 빈 줄, 정답/해설 등 무시
      if (/^(정답|해설|부록|색인|책 속의 책)/.test(line)) continue;

      chapterNumber++;
      await this.prisma.materialChapter.create({
        data: {
          materialId,
          chapterNumber,
          title: line.substring(0, 200), // 200자 제한
        },
      });
    }
  }

  /**
   * 알라딘 API 도서 검색 프록시
   */
  async aladinSearch(query: string, maxResults = 10) {
    if (!query) return [];

    // TTBKey는 환경변수 또는 하드코딩
    const ttbkey = process.env.ALADIN_API_KEY || 'ttbwithjuno2323001';

    // CategoryId 76000: 중고등참고서, 50246: 고등참고서 등
    // 여기서는 넓게 검색하기 위해 파라미터로 받거나 지정하지 않음
    const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
    url.searchParams.append('ttbkey', ttbkey);
    url.searchParams.append('Query', query);
    url.searchParams.append('QueryType', 'Title');
    url.searchParams.append('MaxResults', maxResults.toString());
    url.searchParams.append('start', '1');
    url.searchParams.append('SearchTarget', 'Book');
    url.searchParams.append('output', 'js');
    url.searchParams.append('Version', '20131101');
    url.searchParams.append('OptResult', 'subInfo');
    // url.searchParams.append('CategoryId', '76000'); // 너무 좁히면 안 나올수도 있으므로 생략 또는 옵션

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Aladin API error: ${response.status}`);
      }
      const data = await response.json();

      if (!data.item || !Array.isArray(data.item)) {
        return [];
      }

      return data.item.map((item: any) => ({
        id: item.itemId || item.isbn13,
        name: item.title,
        publisher: item.publisher,
        author: item.author,
        cover: item.cover,
        isbn: item.isbn13 || item.isbn,
        totalPages: item.subInfo?.itemPage || null,
        pubDate: item.pubDate,
      }));
    } catch (err) {
      this.logger.error(`Aladin search failed: ${err.message}`);
      return [];
    }
  }
}
