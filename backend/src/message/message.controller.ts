import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from './message.service';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async sendMessage(
    @Req() req: any,
    @Body() body: { receiverId: string; studentId?: number; content: string },
  ) {
    const rawId = req.user?.sub || req.user?.userId;
    const userId = rawId ? (String(rawId).startsWith('sp_') ? String(rawId) : `sp_${rawId}`) : '0';
    return this.messageService.sendMessage({
      senderId: userId,
      receiverId: body.receiverId,
      studentId: body.studentId,
      content: body.content,
    });
  }

  @Get('inbox')
  async getInbox(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const rawId = req.user?.sub || req.user?.userId;
    const userId = rawId ? (String(rawId).startsWith('sp_') ? String(rawId) : `sp_${rawId}`) : '0';
    return this.messageService.getInbox(userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('sent')
  async getSent(@Req() req: any, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const rawId = req.user?.sub || req.user?.userId;
    const userId = rawId ? (String(rawId).startsWith('sp_') ? String(rawId) : `sp_${rawId}`) : '0';
    return this.messageService.getSent(userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const rawId = req.user?.sub || req.user?.userId;
    const userId = rawId ? (String(rawId).startsWith('sp_') ? String(rawId) : `sp_${rawId}`) : '0';
    const count = await this.messageService.getUnreadCount(userId);
    return { count };
  }

  @Get('conversation/:otherUserId')
  async getConversation(
    @Req() req: any,
    @Param('otherUserId') otherUserId: string,
    @Query('studentId') studentId?: string,
  ) {
    const rawId = req.user?.sub || req.user?.userId;
    const userId = rawId ? (String(rawId).startsWith('sp_') ? String(rawId) : `sp_${rawId}`) : '0';
    return this.messageService.getConversation(
      userId,
      otherUserId,
      studentId ? parseInt(studentId) : undefined,
    );
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const rawId = req.user?.sub || req.user?.userId;
    const userId = rawId ? (String(rawId).startsWith('sp_') ? String(rawId) : `sp_${rawId}`) : '0';
    return this.messageService.markAsRead(parseInt(id), userId);
  }
}
