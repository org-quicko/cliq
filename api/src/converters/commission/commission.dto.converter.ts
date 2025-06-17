import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../../dtos';
import { Commission } from '../../entities';

@Injectable()
export class CommissionConverter {
	convert(commission: Commission): CommissionDto {
		const commissionDto = new CommissionDto();

		commissionDto.commissionId = commission.commissionId;
		commissionDto.amount = commission.amount;
		commissionDto.conversionType = commission.conversionType;

		commissionDto.createdAt = new Date(commission.createdAt);
		commissionDto.updatedAt = new Date(commission.updatedAt);

		return commissionDto;
	}
}
