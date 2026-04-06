import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { ReferralDto } from '../dtos';
import { ReferralView } from '../entities';
import { ReferralConverter } from './referral.converter';

@Injectable()
export class ReferralListConverter extends PaginatedListConverter<ReferralView, ReferralDto> {
	constructor(referralConverter: ReferralConverter) {
		super({
			convert: (entity) => referralConverter.convertTo(entity),
		});
	}
}
