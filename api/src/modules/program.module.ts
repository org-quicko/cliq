import { forwardRef, Module } from '@nestjs/common';
import { ProgramService } from '../services/program.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramController } from '../controllers/program.controller';
import {
	Program,
	ProgramUser,
	ProgramPromoter,
	Commission,
	Purchase,
	ReferralView,
	PromoterAnalyticsView,
} from '../entities';
import { PromoterModule } from './promoter.module';
import { ProgramConverter } from 'src/converters/program/program.dto.converter';
import { ProgramPromoterService } from '../services/programPromoter.service';
import { ContactModule } from './contact.module';
import { PurchaseModule } from './purchase.module';
import { SignUpModule } from './signUp.module';
import { ReferralModule } from './referral.module';
import { CommissionModule } from './commission.module';
import { CircleModule } from './circle.module';
import { PromoterAnalyticsModule } from './promoterAnalytics.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Program,
			ProgramUser,
			ProgramPromoter,
			Purchase,
			Commission,
			PromoterAnalyticsView,
			ReferralView,
		]),
		CommissionModule,
		PromoterModule,
		ReferralModule,
		PromoterAnalyticsModule,
		forwardRef(() => CircleModule),
		forwardRef(() => ContactModule),
		forwardRef(() => PurchaseModule),
		forwardRef(() => SignUpModule),
	],
	controllers: [ProgramController],
	providers: [ProgramService, ProgramConverter, ProgramPromoterService],
	exports: [ProgramService, ProgramConverter, ProgramPromoterService],
})
export class ProgramModule { }
