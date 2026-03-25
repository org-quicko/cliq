import { Module } from '@nestjs/common';
import { FunctionService } from '../services/function.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionController } from '../controllers/function.controller';
import { Function } from '../entities/function.entity';
import { ProgramModule } from './program.module';
import { FunctionConverter } from '../converters/function.converter';
import { FunctionPaginatedConverter } from '../converters/functionPaginated.converter';
import { CircleModule } from './circle.module';
import { Condition, Circle } from '../entities';
import { ConditionConverter } from 'src/converters/condition.converter';
import { PromoterModule } from './promoter.module';
import { CommissionModule } from './commission.module';
import { FunctionTriggerService } from 'src/services/functionTrigger.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Function,
			Condition,
			Circle,
		]),
		ProgramModule,
		PromoterModule,
		CircleModule,
		CommissionModule,
	],
	controllers: [FunctionController],
	providers: [FunctionService, FunctionTriggerService, ConditionConverter, FunctionConverter, FunctionPaginatedConverter],
	exports: [FunctionService, ConditionConverter, FunctionConverter, FunctionPaginatedConverter],
})
export class FunctionModule { }
