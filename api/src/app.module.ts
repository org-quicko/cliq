import 'dotenv/config';
import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user.module';
import { ProgramModule } from './modules/program.module';
import { CircleModule } from './modules/circle.module';
import { ContactModule } from './modules/contact.module';
import { FunctionModule } from './modules/function.module';
import { LinkModule } from './modules/link.module';
import { MemberModule } from './modules/member.module';
import { PromoterModule } from './modules/promoter.module';
import { PurchaseModule } from './modules/purchase.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SignUpModule } from './modules/signUp.module';
import { LoggerModule } from './modules/logger.module';
import { AuthModule } from './modules/auth.module';
import { ApiKeyModule } from './modules/apiKey.module';
import { ReferralModule } from './modules/referral.module';
import { BullModule } from '@nestjs/bullmq';
import { MaterializedViewSubscriber } from './subscribers/materializedView.subscriber';
import { WebhookModule } from './modules/webhook.module';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: 'localhost',
			port: parseInt(process.env.DB_PORT ?? '5432'),
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			autoLoadEntities: true,
			synchronize: true,
			logging: true, // TODO: implement logging levels for typeorm
			poolSize: 10,
			connectTimeoutMS: 2000,
			maxQueryExecutionTime: 5000,
			subscribers: [MaterializedViewSubscriber],
		}),
		EventEmitterModule.forRoot(),
		BullModule.forRoot({
			connection: {
				host: 'localhost',
				port: parseInt(process.env.REDIS_PORT ?? '6379'),
			},
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
		SignUpModule,
		WebhookModule,
		LoggerModule,
	],
	controllers: [AppController],
	providers: [AppService, Logger],
	exports: [Logger],
})
export class AppModule { }
