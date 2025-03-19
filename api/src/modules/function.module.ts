import { Module } from '@nestjs/common';
import { FunctionService } from '../services/function.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionController } from '../controllers/function.controller';
import { Function } from '../entities/function.entity';
import { ProgramModule } from './program.module';
import { FunctionConverter } from '../converters/function.converter';
import { CircleModule } from './circle.module';
import { Condition } from '../entities';
import { ConditionConverter } from 'src/converters/condition.converter';
import { PromoterModule } from './promoter.module';
import { CommissionModule } from './commission.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Function, 
			Condition,
		]),
		ProgramModule,
		PromoterModule,
		CircleModule,
		CommissionModule,
	],
	controllers: [FunctionController],
	providers: [FunctionService, ConditionConverter, FunctionConverter],
	exports: [FunctionService, ConditionConverter, FunctionConverter],
})
export class FunctionModule {}
