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
	SignUp,
} from '../entities';
import { PromoterAnalyticsDayWiseView } from '../entities/promoterAnalyticsDayWiseView.entity';
import { PromoterModule } from './promoter.module';
import { ProgramConverter } from 'src/converters/program/program.dto.converter';
import { ProgramAnalyticsConverter } from 'src/converters/program/program_analytics.workbook.converter';
import { PromoterAnalyticsConverter } from 'src/converters/promoter/promoter_analytics.workbook.converter';
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
			SignUp,
			Purchase,
			Commission,
			PromoterAnalyticsView,
			PromoterAnalyticsDayWiseView,
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
	providers: [ProgramService, ProgramConverter, ProgramAnalyticsConverter, PromoterAnalyticsConverter, ProgramPromoterService],
	exports: [ProgramService, ProgramConverter, ProgramPromoterService],
})
export class ProgramModule { }
