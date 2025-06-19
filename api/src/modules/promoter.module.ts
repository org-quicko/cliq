import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoterController } from '../controllers/promoter.controller';
import {
	Promoter,
	PromoterMember,
	Contact,
	Purchase,
	SignUp,
	ReferralView,
	PromoterAnalyticsView,
	Commission,
	Link,
	ProgramPromoter,
} from '../entities';
import { PromoterService } from '../services/promoter.service';
import { PromoterMemberService } from '../services/promoterMember.service';
import { PromoterConverter } from '../converters/promoter/promoter.dto.converter';
import { CommissionModule } from './commission.module';
import { ProgramModule } from './program.module';
import { LinkAnalyticsView } from 'src/entities/linkAnalytics.view';
import { ReferralModule } from './referral.module';
import { LinkModule } from './link.module';
import { ContactModule } from './contact.module';
import { PurchaseModule } from './purchase.module';
import { SignUpModule } from './signUp.module';
import { PromoterAnalyticsModule } from './promoterAnalytics.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Promoter,
			PromoterMember,
			ProgramPromoter,
			Contact,
			Commission,
			SignUp,
			Purchase,
			LinkAnalyticsView,
			PromoterAnalyticsView,
			ReferralView,
			Commission,
			Link
		]),
		CommissionModule,
		ContactModule,
		PurchaseModule,
		ReferralModule,
		PromoterAnalyticsModule,
		SignUpModule,
		forwardRef(() => LinkModule),
		forwardRef(() => ProgramModule),
	],
	controllers: [PromoterController],
	providers: [PromoterService, PromoterMemberService, PromoterConverter],
	exports: [PromoterService, PromoterConverter, PromoterMemberService],
})
export class PromoterModule { }
