import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, type AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import type { HubGroup, HubMember } from './types';

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 200;

interface HubEnvelope<T> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
}

/**
 * Hub internal API client (service token 기반).
 * - 위성앱 백엔드 ↔ Hub 서버 간 read-only 호출
 * - 사용자 액션(CRUD)은 별도 HubUserClient(추후)에서 user JWT forward
 */
@Injectable()
export class HubServiceClient implements OnModuleInit {
  private readonly logger = new Logger(HubServiceClient.name);
  private baseUrl = '';
  private serviceId = '';
  private serviceToken = '';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.baseUrl =
      this.config.get<string>('HUB_BASE_URL') || this.config.get<string>('HUB_API_URL') || '';
    this.serviceId = this.config.get<string>('HUB_SERVICE_ID') || 'studyplanner';
    this.serviceToken = this.config.get<string>('HUB_SERVICE_TOKEN') || '';

    if (!this.baseUrl) this.logger.warn('HUB_BASE_URL 미설정 — internal API 호출 실패 예정');
    if (!this.serviceToken)
      this.logger.warn('HUB_SERVICE_TOKEN 미설정 — internal API 호출 시 401 발생');
  }

  /** 한 사용자가 속한 모든 반 목록 */
  async getMyGroups(hubUserId: string): Promise<HubGroup[]> {
    const body = await this.request<{ groups?: HubGroup[] }>(
      `/api/internal/users/${encodeURIComponent(hubUserId)}/groups`,
    );
    return body?.groups ?? [];
  }

  /** 한 반의 멤버 목록 + 닉네임/프로필 */
  async getGroupMembers(groupId: string): Promise<HubMember[]> {
    const body = await this.request<{ members?: HubMember[] }>(
      `/api/internal/groups/${encodeURIComponent(groupId)}/members`,
    );
    return body?.members ?? [];
  }

  /**
   * GET 요청 + 5xx/네트워크 오류 시 지수 backoff 재시도 (최대 3회).
   * - 401은 그대로 전파 (운영자가 토큰 재발급. 자동 갱신 금지)
   * - Hub envelope `{ success, data }` 를 자동 해제해서 data를 반환
   */
  private async request<T>(path: string): Promise<T | undefined> {
    if (!this.baseUrl) {
      throw new Error('HUB_BASE_URL not configured');
    }
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'X-Service-Id': this.serviceId,
    };
    if (this.serviceToken) {
      headers.Authorization = `Bearer ${this.serviceToken}`;
    }
    const config: AxiosRequestConfig = { headers, timeout: DEFAULT_TIMEOUT_MS };

    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await firstValueFrom(this.http.get<HubEnvelope<T>>(url, config));
        const body = res.data;
        if (body && body.success === false) {
          throw new Error(`Hub ${path} success:false (${body.statusCode}) ${body.message ?? ''}`);
        }
        return body?.data;
      } catch (e) {
        lastErr = e;
        const ax = e as AxiosError<HubEnvelope<unknown>>;
        const status = ax.response?.status ?? 0;
        if (status === 401) {
          const hubMsg = ax.response?.data?.message;
          this.logger.error(
            `Hub 401 (${path}) — service token 만료/무효. 운영자 재발급 필요.${hubMsg ? ` Hub: ${hubMsg}` : ''}`,
          );
          throw e;
        }
        const isRetryable = !ax.response || status >= 500;
        if (isRetryable && attempt < MAX_RETRIES) {
          const wait = BACKOFF_BASE_MS * Math.pow(2, attempt);
          this.logger.warn(
            `Hub ${path} ${status || 'network'} (attempt ${attempt + 1}/${MAX_RETRIES + 1}) — ${wait}ms 후 재시도`,
          );
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        throw e;
      }
    }
    throw lastErr;
  }
}
