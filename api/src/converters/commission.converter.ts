import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../dtos';
import { Commission } from '../entities';
import { CommissionRow, CommissionsSheet, CommissionTable, PromoterWorkbook } from 'generated/sources';

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

	getSheetRow(commission: Commission): CommissionRow {
		const newCommissionRow = new CommissionRow([]);

		newCommissionRow.setCommissionId(commission.commissionId);
		newCommissionRow.setCommission(commission.amount);
		newCommissionRow.setConversionType(commission.conversionType);
		newCommissionRow.setRevenue(commission.revenue);
		newCommissionRow.setCreatedAt(commission.createdAt.toISOString());

		return newCommissionRow;
	}

	convertToSheet(commissions: Commission[]): PromoterWorkbook {
		const newCommissionTable = new CommissionTable();

		commissions.forEach((commission) => {
			const newCommissionRow = this.getSheetRow(commission);
			newCommissionTable.addRow(newCommissionRow);
		});


		const commissionSheet = new CommissionsSheet();
		commissionSheet.addCommissionTable(newCommissionTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(commissionSheet);

		return promoterWorkbook;
	}
}
