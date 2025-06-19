import { Injectable } from '@nestjs/common';
import { PromoterDto } from '../../dtos';
import { Promoter } from '../../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class PromoterConverter {
	public convert(promoter: Promoter, acceptedTermsAndConditions: boolean): PromoterDto {
		try {
			const promoterDto = new PromoterDto();

			promoterDto.promoterId = promoter.promoterId;

			promoterDto.name = promoter.name;
			promoterDto.logoUrl = promoter.logoUrl;
			promoterDto.status = promoter.status;
			promoterDto.acceptedTermsAndConditions = acceptedTermsAndConditions;

			promoterDto.createdAt = new Date(promoter.createdAt);
			promoterDto.updatedAt = new Date(promoter.updatedAt);

			return promoterDto;
		} catch (error) {
			throw new ConverterException('Error converting Promoter entity to PromoterDto', error);
		}
	}
}
