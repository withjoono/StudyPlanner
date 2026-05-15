import { Injectable, Logger } from '@nestjs/common';
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

  /** atptCode+schulCode 기준으로 NeisSchool 캐시 레코드 찾거나 생성 */
  private async findOrCreateSchool(atptCode: string, schulCode: string): Promise<number> {
    const school = await this.prisma.neisSchool.upsert({
      where: { atptCode_schulCode: { atptCode, schulCode } },
      create: { atptCode, atptName: '', schulCode, schulName: '', schulKind: '' },
      update: {},
    });
    return school.id;
  }

  /** 학교 행사 일정 조회 (DB 캐시 → NEIS API) */
  async getSchedule(atptCode: string, schulCode: string, year: number, month?: number) {
    const schoolId = await this.findOrCreateSchool(atptCode, schulCode);
    const where: any = { schoolId, year };
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

    return this.fetchAndCacheSchedule(schoolId, atptCode, schulCode, year, month);
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

  /** 시간표 조회 (NEIS API 직접 호출) */
  async getTimetable(
    atptCode: string,
    schulCode: string,
    date: string, // YYYYMMDD
    schoolLevel?: string,
    grade?: string,
    classNm?: string,
  ) {
    if (!schoolLevel || !grade) return [];

    const endpoint = this.getTimetableEndpoint(schoolLevel);
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
        ATPT_OFCDC_SC_CODE: atptCode,
        SD_SCHUL_CODE: schulCode,
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

  private getTimetableEndpoint(schoolLevel: string): string {
    if (schoolLevel === 'high' || schoolLevel.includes('고등')) return 'hisTimetable';
    if (schoolLevel === 'middle' || schoolLevel.includes('중학') || schoolLevel.includes('중등'))
      return 'misTimetable';
    return 'elsTimetable';
  }
}
