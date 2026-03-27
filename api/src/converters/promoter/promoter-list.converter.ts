import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from '../paginated-list.converter';
import { PromoterConverter } from './promoter.dto.converter';
import { PromoterDto } from '../../dtos';
import { Promoter } from '../../entities';

@Injectable()
export class PromoterListConverter extends PaginatedListConverter<
  Promoter,
  PromoterDto,
  [Map<string, string | undefined>]
> {
  constructor(promoterConverter: PromoterConverter) {
    super({
      convert: (promoter: Promoter, adminEmailMap: Map<string, string | undefined>) =>
        promoterConverter.convert(promoter, true, adminEmailMap.get(promoter.promoterId)),
    });
  }
}