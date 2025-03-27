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
	PromoterStatsView,
} from '../entities';
import { PromoterModule } from './promoter.module';
import { ProgramConverter } from 'src/converters/program.converter';
import { ProgramPromoterService } from '../services/programPromoter.service';
import { ContactModule } from './contact.module';
import { PurchaseModule } from './purchase.module';
import { SignUpModule } from './signUp.module';
import { ReferralModule } from './referral.module';
import { CommissionModule } from './commission.module';
import { CircleModule } from './circle.module';
import { PromoterStatsModule } from './promoterStats.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Program,
			ProgramUser,
			ProgramPromoter,
			Purchase,
			Commission,
			PromoterStatsView,
			ReferralView,
		]),
		CommissionModule,
		PromoterModule,
		ReferralModule,
		PromoterStatsModule,
		forwardRef(() => CircleModule),
		forwardRef(() => ContactModule),
		forwardRef(() => PurchaseModule),
		forwardRef(() => SignUpModule),
	],
	controllers: [ProgramController], 
	providers: [ProgramService, ProgramConverter, ProgramPromoterService],
	exports: [ProgramService, ProgramConverter, ProgramPromoterService],
})
export class ProgramModule {}
