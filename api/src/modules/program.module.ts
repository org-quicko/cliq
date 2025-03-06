import { Module } from '@nestjs/common';
import { ProgramService } from '../services/program.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramController } from "../controllers/program.controller";
import { Program, ProgramUser, ProgramPromoter, Commission, Purchase, ReferralView, ReferralViewProgram } from '../entities';
import { PromoterModule } from './promoter.module';
import { ProgramConverter } from 'src/converters/program.converter';
import { ContactConverter } from 'src/converters/contact.converter';
import { PurchaseConverter } from 'src/converters/purchase.converter';
import { SignUpConverter } from '../converters/signUp.converter';
import { ProgramPromoterService } from '../services/programPromoter.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Program,
      ProgramUser,
      ProgramPromoter,
      Purchase,
      Commission,
      ReferralView,
      ReferralViewProgram
    ]), 
    PromoterModule,
  ],
  controllers: [ProgramController],
  providers: [
    ProgramService,
    ProgramConverter,
    ContactConverter,
    PurchaseConverter,
    SignUpConverter,
    ProgramPromoterService,
  ],
  exports: [ProgramService, PromoterModule, ProgramPromoterService],
})
export class ProgramModule { }
