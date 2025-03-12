import { Injectable } from '@nestjs/common';
import { ProgramDto } from '../dtos';
import { Program } from '../entities';
import { LoggerService } from 'src/services/logger.service';
import { ProgramSummaryList, ProgramWorkbook, ProgwPromotersSheet, ProgwSummarySheet, PromotersRow, PromotersTable } from 'generated/sources';
import { conversionTypeEnum } from 'src/enums';
import { formatDate } from 'src/utils';

@Injectable()
export class ProgramConverter {

	constructor(
		private logger: LoggerService,
	) { }

	convert(program: Program): ProgramDto {
		this.logger.info(`START: convert function: ProgramConverter.`);

		const programDto = new ProgramDto();

		programDto.programId = program.programId;

		programDto.name = program.name;
		programDto.website = program.website;
		programDto.themeColor = program.themeColor;
		programDto.visibility = program.visibility;
		programDto.currency = program.currency;
		programDto.dateFormat = program.dateFormat;
		programDto.timeZone = program.timeZone;

		programDto.createdAt = program.createdAt;
		programDto.updatedAt = program.updatedAt;

		this.logger.info(`END: convert function: ProgramConverter.`);
		return programDto;
	}

	convertToReportWorkbook(
		program: Program,
		startDate: Date,
		endDate: Date,
	): ProgramWorkbook {
		const programWorkbook = new ProgramWorkbook();

		const promotersSheet = new ProgwPromotersSheet();
		const promotersTable = new PromotersTable();
		
		let totalPurchases = 0;
		let totalRevenue = 0;
		let totalSignUps = 0;
		let totalPurchasesCommission = 0;
		let totalSignUpsCommission = 0;
		const totalPromoters = program.programPromoters.length;

		program.programPromoters.forEach((programPromoter) => {
			const promoter = programPromoter.promoter;

			const row = new PromotersRow([]);

			let signUpsCommission = 0;
			let purchasesCommission = 0;
			let revenue = 0;

			const signUps = Number(promoter.signUps.length);
			const purchases = Number(promoter.purchases.length);

			promoter.commissions.forEach((commission) => {
				if (commission.conversionType === conversionTypeEnum.SIGNUP) {
					signUpsCommission += Number(commission.amount);
					
				} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
					purchasesCommission += Number(commission.amount);
					revenue += Number(commission.revenue);
				}
			});

			totalSignUpsCommission += Number(signUpsCommission);
			totalPurchasesCommission += Number(purchasesCommission);
			totalSignUps += Number(signUps);
			totalPurchases += Number(purchases);
			totalRevenue += Number(revenue);

			row.setPromoterId(promoter.promoterId);
			row.setPromoterName(promoter.name);
			row.setSignups(Number(signUps));
			row.setCommissionOnSignups(Number(signUpsCommission));
			row.setPurchases(Number(purchases));
			row.setCommissionOnPurchases(Number(purchasesCommission));
			row.setRevenue(Number(revenue));
			row.setTotalCommission(Number(signUpsCommission) + Number(purchasesCommission));

			promotersTable.addRow(row);
		});

		promotersSheet.addPromotersTable(promotersTable);

		const summarySheet = new ProgwSummarySheet();
		const programSummaryList = new ProgramSummaryList();

		const dateFormat = program.dateFormat;

		programSummaryList.addFrom(formatDate(startDate, dateFormat));
		programSummaryList.addTo(formatDate(endDate, dateFormat));
		programSummaryList.addPromoters(Number(totalPromoters))
		programSummaryList.addProgramId(program.programId);
		programSummaryList.addSignups(Number(totalSignUps));
		programSummaryList.addCommissionOnSignups(Number(totalSignUpsCommission));
		programSummaryList.addPurchases(Number(totalPurchases));
		programSummaryList.addCommissionOnPurchases(Number(totalPurchasesCommission));
		programSummaryList.addRevenue(Number(totalRevenue));
		programSummaryList.addTotalCommission(Number(totalSignUpsCommission) + Number(totalPurchasesCommission));

		summarySheet.addProgramSummaryList(programSummaryList);

		programWorkbook.addProgwSummary(summarySheet);
		programWorkbook.addProgwPromoters(promotersSheet);

		return programWorkbook;

	}
}
