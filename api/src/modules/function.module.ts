import { Module } from '@nestjs/common';
import { FunctionService } from '../services/function.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionController } from "../controllers/function.controller";
import { Function } from '../entities/function.entity';
import { ProgramModule } from './program.module';
import { FunctionConverter } from '../converters/function.converter';
import { CircleModule } from './circle.module';
import { Condition } from '../entities';
import { ConditionConverter } from 'src/converters/condition.converter';

@Module({
  imports: [TypeOrmModule.forFeature([Function, Condition]), ProgramModule, CircleModule],
  controllers: [FunctionController],
  providers: [FunctionService, ConditionConverter, FunctionConverter],
})
export class FunctionModule {}
