import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoterController } from "../controllers/promoter.controller";
import { Promoter, PromoterMember, Contact, Purchase, SignUp, ReferralView, ReferralViewAggregate, Commission } from '../entities';
import { PromoterService } from '../services/promoter.service';
import { PromoterMemberService } from '../services/promoterMember.service';
import { PromoterConverter } from '../converters/promoter.converter';
import { MemberConverter } from '../converters/member.converter';
import { ContactConverter } from '../converters/contact.converter';
import { PurchaseConverter } from '../converters/purchase.converter';
import { CommissionModule } from './commission.module';
import { SignUpConverter } from 'src/converters/signUp.converter';
import { ProgramModule } from './program.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Promoter,
      PromoterMember,
      Contact,
      SignUp,
      Purchase,
      ReferralView,
      ReferralViewAggregate,
      Commission
    ]),
    CommissionModule,
    forwardRef(() => ProgramModule)
  ],
  controllers: [PromoterController],
  providers: [
    PromoterService, 
    PromoterMemberService, 
    PromoterConverter, 
    MemberConverter, 
    ContactConverter, 
    PurchaseConverter, 
    SignUpConverter,
  ],
  exports: [PromoterService, PromoterConverter, PromoterMemberService, CommissionModule]
})
export class PromoterModule { }
