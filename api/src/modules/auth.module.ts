import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from '../services/authorization.service';
import { AuthGuard } from '../guards/auth/auth.guard';
import { LinkModule } from './link.module';
import { CircleModule } from './circle.module';
import { FunctionModule } from './function.module';
import { SignUpModule } from './signUp.module';
import { PurchaseModule } from './purchase.module';

@Global()
@Module({
	imports: [
		LinkModule,
		CircleModule,
		FunctionModule,
		SignUpModule,
		PurchaseModule,
	],
	providers: [AuthorizationService, AuthGuard],
	exports: [AuthorizationService, AuthGuard],
})
export class AuthModule {}
