import { forwardRef, Module } from '@nestjs/common';
import { CircleService } from '../services/circle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleController } from '../controllers/circle.controller';
import { CirclePromoter, Circle } from '../entities';
import { ProgramModule } from './program.module';
import { CircleConverter } from '../converters/circle.converter';
import { PromoterModule } from './promoter.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Circle, 
			CirclePromoter,
		]),
		forwardRef(() => ProgramModule),
		PromoterModule,
	],
	controllers: [CircleController],
	providers: [CircleService, CircleConverter],
	exports: [CircleService, CircleConverter],
})
export class CircleModule {}
