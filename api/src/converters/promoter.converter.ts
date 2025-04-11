import { Injectable } from '@nestjs/common';
import { PromoterDto } from '../dtos';
import { Promoter } from '../entities';

@Injectable()
export class PromoterConverter {
	public convert(promoter: Promoter, acceptedTermsAndConditions: boolean): PromoterDto {
		const promoterDto = new PromoterDto();

		promoterDto.promoterId = promoter.promoterId;

		promoterDto.name = promoter.name;
		promoterDto.logoUrl = promoter.logoUrl;
		promoterDto.acceptedTermsAndConditions = acceptedTermsAndConditions;

		promoterDto.createdAt = new Date(promoter.createdAt);
		promoterDto.updatedAt = new Date(promoter.updatedAt);

		return promoterDto;
	}
}
