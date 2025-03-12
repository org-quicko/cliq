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
import { MemberConverter } from '../converters/member.converter';
import { ContactConverter } from '../converters/contact.converter';
import { PurchaseConverter } from '../converters/purchase.converter';
import { CommissionModule } from './commission.module';
import { SignUpConverter } from 'src/converters/signUp.converter';
import { ProgramModule } from './program.module';
import { LinkStatsView } from 'src/entities/link.view';
import { LinkConverter } from 'src/converters/link.converter';

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
		forwardRef(() => ProgramModule),
	],
	controllers: [PromoterController],
	providers: [
		PromoterService,
		PromoterMemberService,
		PromoterConverter,
		MemberConverter,
		ContactConverter,
		LinkConverter,
		PurchaseConverter,
		SignUpConverter,
	],
	exports: [
		PromoterService,
		PromoterConverter,
		PromoterMemberService,
		CommissionModule,
	],
})
export class PromoterModule {}
