import 'reflect-metadata';
import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user.module';
import { ProgramModule } from './modules/program.module';
import { CircleModule } from './modules/circle.module';
import { ContactModule } from './modules/contact.module';
import { FunctionModule } from './modules/function.module';
import { LinkModule } from './modules/link.module';
import { MemberModule } from './modules/member.module';
import { PromoterModule } from './modules/promoter.module';
import { PurchaseModule } from './modules/purchase.module';
import { SignUpModule } from './modules/signUp.module';
import { LoggerModule } from './modules/logger.module';
import { AuthModule } from './modules/auth.module';
import { ApiKeyModule } from './modules/apiKey.module';
import { ReferralModule } from './modules/referral.module';
import { WebhookModule } from './modules/webhook.module';
import { PromoterAnalyticsModule } from './modules/promoterAnalytics.module';
import { MaterializedViewRefreshModule } from './modules/materializedViewRefresh.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { bullMqConfig, jwtConfig, typeOrmConfig } from './config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env'],
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				...(typeOrmConfig(configService))
			})
		}),
		EventEmitterModule.forRoot(),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: bullMqConfig,
		}),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: jwtConfig,
			global: true
		}),
		AuthModule,
		ApiKeyModule,
		UserModule,
		ProgramModule,
		CircleModule,
		ContactModule,
		FunctionModule,
		LinkModule,
		MemberModule,
		PromoterModule,
		PurchaseModule,
		ReferralModule,
		PromoterAnalyticsModule,
		MaterializedViewRefreshModule,
		SignUpModule,
		WebhookModule,
		LoggerModule,
	],
	controllers: [AppController],
	providers: [
		AppService, 
		Logger,
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: PermissionsGuard,
		},
	],
	exports: [Logger],
})
export class AppModule { }
