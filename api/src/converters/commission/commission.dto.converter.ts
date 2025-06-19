import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../../dtos';
import { Commission } from '../../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class CommissionConverter {
	convert(commission: Commission): CommissionDto {
		try {
			const commissionDto = new CommissionDto();
	
			commissionDto.commissionId = commission.commissionId;
			commissionDto.amount = commission.amount;
			commissionDto.conversionType = commission.conversionType;
	
			commissionDto.createdAt = new Date(commission.createdAt);
			commissionDto.updatedAt = new Date(commission.updatedAt);
	
			return commissionDto;
		} catch (error) {
			throw new ConverterException('Error converting Commission entity to CommissionDto', error);			
		}
	}
}
