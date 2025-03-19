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
	ReferralAggregateView,
	Commission,
	Link,
} from '../entities';
import { PromoterService } from '../services/promoter.service';
import { PromoterMemberService } from '../services/promoterMember.service';
import { PromoterConverter } from '../converters/promoter.converter';
import { CommissionModule } from './commission.module';
import { ProgramModule } from './program.module';
import { LinkStatsView } from 'src/entities/link.view';
import { ReferralModule } from './referral.module';
import { LinkModule } from './link.module';
import { ContactModule } from './contact.module';
import { PurchaseModule } from './purchase.module';
import { SignUpModule } from './signUp.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Promoter,
			PromoterMember,
			Contact,
			SignUp,
			Purchase,
			LinkStatsView,
			ReferralAggregateView,
			ReferralView,
			Commission,
			Link
		]),
		CommissionModule,
		ContactModule,
		PurchaseModule,
		ReferralModule,
		SignUpModule,
		forwardRef(() => LinkModule),
		forwardRef(() => ProgramModule),
	],
	controllers: [PromoterController],
	providers: [PromoterService, PromoterMemberService, PromoterConverter],
	exports: [PromoterService, PromoterConverter, PromoterMemberService],
})
export class PromoterModule {}
