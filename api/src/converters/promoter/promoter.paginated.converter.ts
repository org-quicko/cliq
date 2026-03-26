import { Injectable } from '@nestjs/common';
import { PromoterConverter } from './promoter.dto.converter';
import { PromoterDto } from '../../dtos';
import { Promoter } from '../../entities';
import { PaginatedList } from '../../dtos/paginated-list.dto';

@Injectable()
export class PromoterPaginatedConverter {
	constructor(private promoterConverter: PromoterConverter) {}

	convert(
		promoters: Array<{ promoter: Promoter; adminMemberEmail?: string }>,
		skip: number,
		take: number,
		count?: number,
	): PaginatedList<PromoterDto> {
		const dtos = promoters.map(({ promoter, adminMemberEmail }) =>
			this.promoterConverter.convert(promoter, true, adminMemberEmail),
		);

		return PaginatedList.Builder.build<PromoterDto>(dtos, skip, take, count);
	}
}
