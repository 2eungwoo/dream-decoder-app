import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthValidator } from './auth.validator';
import { User } from '../users/user.entity';
import { PasswordService } from './password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, AuthValidator, PasswordService],
  exports: [AuthService, AuthValidator, PasswordService],
})
export class AuthModule {}
