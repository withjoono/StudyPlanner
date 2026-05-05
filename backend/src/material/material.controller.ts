import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MaterialService } from './material.service';
import { MaterialCategory } from '@prisma/client';

@ApiTags('materials')
@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('search')
  @ApiOperation({ summary: '교재/인강 자동완성 검색' })
  @ApiQuery({ name: 'q', description: '검색어 (1글자 이상)', required: true })
  @ApiQuery({ name: 'category', enum: MaterialCategory, required: false })
  @ApiQuery({ name: 'limit', required: false, description: '최대 결과 수 (기본 10)' })
  @ApiQuery({ name: 'userId', required: false, description: '사용자 ID (교육과정 필터링용)' })
  async search(
    @Query('q') query: string,
    @Query('category') category?: MaterialCategory,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
  ) {
    return this.materialService.search(query, category, limit ? Number(limit) : 10, userId);
  }

  @Get('aladin-search')
  @ApiOperation({ summary: '알라딘 API 도서 검색 프록시' })
  @ApiQuery({ name: 'q', description: '검색어 (도서명)', required: true })
  @ApiQuery({ name: 'limit', required: false, description: '최대 결과 수 (기본 10)' })
  async aladinSearch(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.materialService.aladinSearch(query, limit ? Number(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: '교재 상세 정보 (목차 포함)' })
  async getDetail(@Param('id') id: number) {
    return this.materialService.getDetail(Number(id));
  }

  @Post('import')
  @ApiOperation({ summary: 'results.json에서 참고서 데이터 일괄 임포트' })
  @ApiQuery({
    name: 'path',
    required: false,
    description: 'JSON 파일 경로 (기본: upload/results.json)',
  })
  async importData(@Query('path') filePath?: string) {
    return this.materialService.importFromJson(filePath);
  }
}
