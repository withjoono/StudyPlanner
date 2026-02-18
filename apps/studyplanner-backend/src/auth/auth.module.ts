import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtHelperService } from './services/jwt-helper.service';
import { HubPermissionGuard } from './guards/hub-permission.guard';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secretBase64 =
          configService.get('AUTH_SECRET') || 'studyplanner-secret-key-change-in-production';
        return {
          secret: Buffer.from(secretBase64, 'base64'),
          signOptions: {
            expiresIn: '2h',
            algorithm: 'HS512' as const,
          },
          verifyOptions: {
            algorithms: ['HS512' as const],
          },
        };
      },
    }),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtHelperService, HubPermissionGuard, AuthService],
  exports: [PassportModule, JwtModule, JwtHelperService, HubPermissionGuard, AuthService],
})
export class AuthModule {}
