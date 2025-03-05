import { forwardRef, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberService } from '../services/member.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from "../controllers/member.controller";
import { Member } from '../entities/member.entity';
import { PromoterMember } from '../entities/promoterMember.entity';
import { MemberConverter } from '../converters/member.converter';
import { MemberAuthService } from '../services/memberAuth.service';
import { PromoterModule } from './promoter.module';
import { MemberPermissionsGuard } from 'src/guards/permissions/memberPermissions.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      PromoterMember,
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => PromoterModule),
  ],
  controllers: [MemberController],
  providers: [MemberService, MemberAuthService, MemberPermissionsGuard, MemberConverter],
  exports: [MemberService, MemberAuthService, MemberPermissionsGuard, MemberConverter]
})
export class MemberModule { }
