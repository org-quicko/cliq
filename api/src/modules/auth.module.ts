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
import { WebhookModule } from './webhook.module';
import { ApiKeyGuard } from 'src/guards/apiKey.guard';
import { PromoterAnalyticsModule } from './promoterAnalytics.module';

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
		PromoterAnalyticsModule,
		SignUpModule,
		WebhookModule,
	],
	providers: [AuthorizationService, AuthGuard, ApiKeyGuard],
	exports: [AuthorizationService, AuthGuard, ApiKeyGuard],
})
export class AuthModule {}
