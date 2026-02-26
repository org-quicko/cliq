import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { ReferralDto } from '../dtos';
import { ReferralView } from '../entities';
import { ReferralUserConverter } from './referralUser.converter';

@Injectable()
export class ReferralPaginatedConverter extends PaginatedListConverter<
  ReferralView,
  ReferralDto,
  [Map<string, string>]  
> {
  constructor(referralConverter: ReferralUserConverter) {
    super({
      convert: (entity, promoterNameMap) =>
        referralConverter.convertTo(entity, promoterNameMap),
    });
  }
}