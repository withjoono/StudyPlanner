import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

const NEIS_BASE = 'https://open.neis.go.kr/hub';

@Injectable()
export class NeisService {
  private readonly logger = new Logger(NeisService.name);
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('NEIS_API_KEY') || '';
  }

  private async getStudent(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { neisSchool: true },
    });
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');
    return student;
  }

  async searchSchools(q: string) {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${NEIS_BASE}/schoolInfo`, {
          params: { KEY: this.apiKey, Type: 'json', SCHUL_NM: q, pSize: 20 },
        }),
      );
      const rows: any[] = data?.schoolInfo?.[1]?.row ?? [];
      return rows.map((r) => ({
        atptCode: r.ATPT_OFCDC_SC_CODE,
        atptName: r.ATPT_OFCDC_SC_NM,
        schulCode: r.SD_SCHUL_CODE,
        schulName: r.SCHUL_NM,
        schulKind: r.SCHUL_KND_SC_NM,
        address: r.ORG_RDNMA || null,
      }));
    } catch (e) {
      this.logger.error('NEIS school search error', e?.message);
      return [];
    }
  }

  async getLinkedSchool(userId: string) {
    const student = await this.getStudent(userId);
    if (!student.neisSchool) return null;
    const s = student.neisSchool;
    return {
      atptCode: s.atptCode,
      atptName: s.atptName,
      schulCode: s.schulCode,
      schulName: s.schulName,
      schulKind: s.schulKind,
      address: s.address,
    };
  }

  async linkSchool(
    userId: string,
    body: {
      atptCode?: string;
      atpt_code?: string;
      atptName?: string;
      atpt_name?: string;
      schulCode?: string;
      schul_code?: string;
      schulName?: string;
      schul_name?: string;
      schulKind?: string;
      schul_kind?: string;
      address?: string | null;
    },
  ) {
    const atptCode = body.atptCode || body.atpt_code || '';
    const atptName = body.atptName || body.atpt_name || '';
    const schulCode = body.schulCode || body.schul_code || '';
    const schulName = body.schulName || body.schul_name || '';
    const schulKind = body.schulKind || body.schul_kind || '';
    const address = body.address || null;

    const student = await this.getStudent(userId);

    const school = await this.prisma.neisSchool.upsert({
      where: { atptCode_schulCode: { atptCode, schulCode } },
      create: { atptCode, atptName, schulCode, schulName, schulKind, address },
      update: { schulName, atptName, address },
    });

    await this.prisma.student.update({
      where: { id: student.id },
      data: { neisSchoolId: school.id },
    });

    return {
      atptCode: school.atptCode,
      atptName: school.atptName,
      schulCode: school.schulCode,
      schulName: school.schulName,
      schulKind: school.schulKind,
      address: school.address,
    };
  }

  async unlinkSchool(userId: string) {
    const student = await this.getStudent(userId);
    await this.prisma.student.update({
      where: { id: student.id },
      data: { neisSchoolId: null },
    });
  }

  async getSchedule(userId: string, year: number, month?: number) {
    const student = await this.getStudent(userId);
    if (!student.neisSchool) return [];

    const school = student.neisSchool;
    const where: any = { schoolId: school.id, year };
    if (month) where.month = month;

    const cached = await this.prisma.neisSchedule.findMany({
      where,
      orderBy: { eventDate: 'asc' },
    });

    if (cached.length > 0) {
      return cached.map((e) => ({
        id: e.id,
        date: e.eventDate,
        eventName: e.eventName,
        isHoliday: e.isHoliday,
      }));
    }

    return this.fetchAndCacheSchedule(school.id, school.atptCode, school.schulCode, year, month);
  }

  async refreshSchedule(userId: string, year: number) {
    const student = await this.getStudent(userId);
    if (!student.neisSchool) return [];

    const school = student.neisSchool;
    await this.prisma.neisSchedule.deleteMany({ where: { schoolId: school.id, year } });

    const results: any[] = [];
    for (let m = 1; m <= 12; m++) {
      const events = await this.fetchAndCacheSchedule(
        school.id,
        school.atptCode,
        school.schulCode,
        year,
        m,
      );
      results.push(...events);
    }
    return results;
  }

  private async fetchAndCacheSchedule(
    schoolId: number,
    atptCode: string,
    schulCode: string,
    year: number,
    month?: number,
  ) {
    try {
      const aaYmd = month ? `${year}${String(month).padStart(2, '0')}` : `${year}`;
      const { data } = await firstValueFrom(
        this.http.get(`${NEIS_BASE}/SchoolSchedule`, {
          params: {
            KEY: this.apiKey,
            Type: 'json',
            ATPT_OFCDC_SC_CODE: atptCode,
            SD_SCHUL_CODE: schulCode,
            AA_YMD: aaYmd,
            pSize: 365,
          },
        }),
      );

      const rows: any[] = data?.SchoolSchedule?.[1]?.row ?? [];
      const toInsert = rows.map((r) => {
        const dateStr: string = r.AA_YMD;
        const eventDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        const eventMonth = parseInt(dateStr.substring(4, 6));
        const isHoliday =
          r.SBTR_DD_SC_NM === '방학' || (r.EVENT_NM as string)?.includes('방학') || false;
        return {
          schoolId,
          eventDate,
          eventName: r.EVENT_NM as string,
          isHoliday,
          year: parseInt(r.AY || dateStr.substring(0, 4)),
          month: eventMonth,
        };
      });

      if (toInsert.length > 0) {
        await this.prisma.neisSchedule.createMany({ data: toInsert, skipDuplicates: true });
      }

      const inserted = await this.prisma.neisSchedule.findMany({
        where: { schoolId, year, ...(month ? { month } : {}) },
        orderBy: { eventDate: 'asc' },
      });

      return inserted.map((e) => ({
        id: e.id,
        date: e.eventDate,
        eventName: e.eventName,
        isHoliday: e.isHoliday,
      }));
    } catch (e) {
      this.logger.error('NEIS schedule fetch error', e?.message);
      return [];
    }
  }

  async getTimetable(userId: string, date: string, gradeOverride?: string, classNm?: string) {
    const student = await this.getStudent(userId);
    if (!student.neisSchool) return [];

    const school = student.neisSchool;
    const grade = gradeOverride || student.grade;
    if (!grade) return [];

    const schoolLevel = this.getSchoolLevel(school.schulKind);
    const endpoint = this.getTimetableEndpoint(schoolLevel);

    // date is YYYYMMDD
    const month = parseInt(date.substring(4, 6));
    const year = parseInt(date.substring(0, 4));
    let sem: string;
    let ay: number;
    if (month >= 3 && month <= 8) {
      sem = '1';
      ay = year;
    } else if (month >= 9) {
      sem = '2';
      ay = year;
    } else {
      sem = '2';
      ay = year - 1;
    }

    try {
      const params: Record<string, string> = {
        KEY: this.apiKey,
        Type: 'json',
        ATPT_OFCDC_SC_CODE: school.atptCode,
        SD_SCHUL_CODE: school.schulCode,
        AY: String(ay),
        SEM: sem,
        ALL_TI_YMD: date,
        GRADE: grade,
        pSize: '10',
      };
      if (classNm) params.CLASS_NM = classNm;

      const { data } = await firstValueFrom(this.http.get(`${NEIS_BASE}/${endpoint}`, { params }));

      const key = Object.keys(data || {}).find((k) => k.toLowerCase().includes('timetable'));
      const rows: any[] = (key ? data[key]?.[1]?.row : null) ?? [];

      return rows.map((r) => ({
        grade: r.GRADE,
        classNm: r.CLASS_NM,
        period: r.PERIO,
        subject: r.ITRT_CNTNT,
        teacher: r.TCHR_NM || null,
      }));
    } catch (e) {
      this.logger.error('NEIS timetable fetch error', e?.message);
      return [];
    }
  }

  private getSchoolLevel(schulKind: string): 'high' | 'middle' | 'elementary' {
    if (schulKind.includes('고등')) return 'high';
    if (schulKind.includes('중학') || schulKind.includes('중등')) return 'middle';
    if (schulKind.includes('초등') || schulKind.includes('초교')) return 'elementary';
    return 'high';
  }

  private getTimetableEndpoint(level: 'high' | 'middle' | 'elementary'): string {
    if (level === 'high') return 'hisTimetable';
    if (level === 'middle') return 'misTimetable';
    return 'elsTimetable';
  }
}
