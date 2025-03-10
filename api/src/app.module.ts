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
import { MaterializedViewSubscriber } from './subscribers/materializedView.subscriber';
import { ApiKeyModule } from './modules/apiKey.module';

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
      logging: true,
      poolSize: 10,
      connectTimeoutMS: 2000,
      maxQueryExecutionTime: 5000,
      subscribers: [MaterializedViewSubscriber]
    }),
    EventEmitterModule.forRoot(),
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
    SignUpModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
  exports: [Logger]
})
export class AppModule { }
