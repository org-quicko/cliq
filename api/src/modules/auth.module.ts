import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from '../services/authorization.service';
import { AuthGuard } from '../guards/auth.guard';
import { LinkModule } from './link.module';
import { CircleModule } from './circle.module';
import { FunctionModule } from './function.module';
import { SignUpModule } from './signUp.module';
import { PurchaseModule } from './purchase.module';
import { ProgramModule } from './program.module';
import { PromoterModule } from './promoter.module';
import { ReferralModule } from './referral.module';
import { CommissionModule } from './commission.module';

@Global()
@Module({
	imports: [
		CircleModule,
		CommissionModule,
		FunctionModule,
		LinkModule,
		ProgramModule,
		PromoterModule,
		PurchaseModule,
		ReferralModule,
		SignUpModule,
	],
	providers: [AuthorizationService, AuthGuard],
	exports: [AuthorizationService, AuthGuard],
})
export class AuthModule {}
