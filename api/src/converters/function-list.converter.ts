import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { FunctionDto } from '../dtos';
import { Function } from '../entities';
import { FunctionConverter } from './function.converter';

@Injectable()
export class FunctionListConverter extends PaginatedListConverter<
  Function,
  FunctionDto,
  [Map<string, string>?]
> {
  constructor(functionConverter: FunctionConverter) {
    super({
      convert: (entity, targetCircleNameMap) =>
        functionConverter.convert(entity, targetCircleNameMap),
    });
  }
}