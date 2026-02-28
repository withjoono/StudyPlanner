import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { UserRole } from '@prisma/client';

@ApiTags('planner-comments')
@Controller('planner/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '코멘트 작성' })
  async createComment(
    @Body()
    dto: {
      studentId: number;
      authorId: string;
      authorRole: UserRole;
      missionId?: number;
      routineId?: number;
      planId?: number;
      content: string;
      subject?: string;
      period?: string;
    },
  ) {
    return this.commentService.createComment(dto);
  }

  @Get()
  @ApiOperation({ summary: '코멘트 목록 조회' })
  async getComments(
    @Query('studentId') studentId?: number,
    @Query('missionId') missionId?: number,
    @Query('routineId') routineId?: number,
    @Query('planId') planId?: number,
    @Query('period') period?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.commentService.getComments({
      studentId,
      missionId,
      routineId,
      planId,
      period,
      limit,
      offset,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '코멘트 읽음 처리' })
  async markAsRead(@Param('id') id: number) {
    return this.commentService.markAsRead(id);
  }

  @Get('unread')
  @ApiOperation({ summary: '읽지 않은 코멘트 수' })
  async getUnreadCount(@Query('studentId') studentId: number) {
    return this.commentService.getUnreadCount(studentId);
  }

  @Get('recent-unread')
  @ApiOperation({ summary: '최근 읽지 않은 코멘트 (대시보드용)' })
  async getRecentUnread(@Query('studentId') studentId: number, @Query('limit') limit?: number) {
    return this.commentService.getRecentUnread(studentId, limit);
  }
}
