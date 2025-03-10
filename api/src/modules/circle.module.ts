import { Module } from '@nestjs/common';
import { CircleService } from '../services/circle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleController } from '../controllers/circle.controller';
import { CirclePromoter, Circle } from '../entities';
import { ProgramModule } from './program.module';
import { CircleConverter } from '../converters/circle.converter';
import { PromoterConverter } from '../converters/promoter.converter';

@Module({
	imports: [
		TypeOrmModule.forFeature([Circle, CirclePromoter]),
		ProgramModule,
	],
	controllers: [CircleController],
	providers: [CircleService, CircleConverter, PromoterConverter],
	exports: [CircleService],
})
export class CircleModule {}
