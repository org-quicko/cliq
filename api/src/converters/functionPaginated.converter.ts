// api/src/converters/functionPaginated.converter.ts
import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { FunctionDto } from '../dtos';
import { Function } from '../entities';
import { FunctionConverter } from './function.converter';
import { PaginatedList } from '../dtos/paginated-list.dto';

@Injectable()
export class FunctionPaginatedConverter {
    constructor(private functionConverter: FunctionConverter) {}

    convert(
        entities: Array<Function>,
        skip: number,
        take: number,
        count?: number,
        targetCircleNameMap?: Map<string, string>
    ): PaginatedList<FunctionDto> {
        const dtos = this.functionConverter.convertMany(entities, targetCircleNameMap);
        return PaginatedList.Builder.build<FunctionDto>(dtos, skip, take, count);
    }
}