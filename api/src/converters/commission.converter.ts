import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../dtos';
import { Commission, Promoter, Purchase, SignUp } from '../entities';
import { CommissionRow, CommissionsSheet, CommissionsSummaryList, CommissionTable, CommissionWorkbook, CwPurchasesSheet, CwSignupsSheet, CwSummarySheet, PromoterWorkbook, PurchaseCommissionsRow, PurchaseCommissionsTable, SignupCommissionsRow, SignupCommissionsTable } from 'generated/sources';
import { isAfter, isBefore } from 'date-fns';
import { conversionTypeEnum } from 'src/enums';
import { maskInfo } from 'src/utils';
import { formatDate } from 'src/utils/formatDate.util';

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
		newCommissionRow.setCommission(Number(commission.amount));
		newCommissionRow.setConversionType(commission.conversionType);
		newCommissionRow.setRevenue(Number(commission.revenue ?? 0));
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

	convertToReportWorkbook(
		signUps: SignUp[],
		purchases: Purchase[],
		promoter: Promoter,
		startDate?: Date,
		endDate?: Date,
	): CommissionWorkbook {
		const commissionWorkbook = new CommissionWorkbook();

		// PURCHASES
		const purchasesSheet = new CwPurchasesSheet();
		const purchasesTable = new PurchaseCommissionsTable();

		const totalPurchases = purchases.length;
		
		let totalPurchaseCommission: number = 0;
		let totalRevenue: number = 0;

		let fromDate: Date = purchases[0].createdAt;
		let toDate: Date = purchases[0].createdAt;

		purchases.forEach((purchase) => {
			const row = new PurchaseCommissionsRow([]);

			let commissionAmount = 0;
			purchase.contact.commissions.forEach((commission) => {
				commissionAmount += commission.amount;
			});

			totalPurchaseCommission += Number(commissionAmount);
			totalRevenue += Number(purchase.amount);

			if (!startDate && !endDate) {
				fromDate = isBefore(purchase.createdAt, fromDate) ? purchase.createdAt : fromDate;
				toDate = isAfter(purchase.createdAt, toDate) ? purchase.createdAt : toDate;
			}

			row.setPurchaseId(purchase.purchaseId);
			row.setContactId(purchase.contact.contactId);
			row.setCommission(Number(commissionAmount));
			row.setItemId(purchase.itemId);
			row.setAmount(Number(purchase.amount));
			row.setUtmSource(purchase?.utmParams?.source);
			row.setUtmMedium(purchase?.utmParams?.medium);

			purchasesTable.addRow(row);
		});

		purchasesSheet.addPurchaseCommissionsTable(purchasesTable);

		
		// SIGNUPS
		const signUpsSheet = new CwSignupsSheet();
		const signUpsTable = new SignupCommissionsTable();

		const totalSignUps = signUps.length;

		let totalSignUpCommission = 0;

		signUps.forEach((signUp) => {
			const row = new SignupCommissionsRow([]);

			const commissionAmount = signUp.contact.commissions.find(commission => commission.conversionType === conversionTypeEnum.SIGNUP)?.amount ?? 0;

			totalSignUpCommission += Number(commissionAmount);

			if (!startDate && !endDate) {
				fromDate = isBefore(signUp.createdAt, fromDate) ? signUp.createdAt : fromDate;
				toDate = isAfter(signUp.createdAt, toDate) ? signUp.createdAt : toDate;
			}

			row.setContactId(signUp.contact.contactId);
			row.setCommission(Number(commissionAmount));
			row.setEmail(maskInfo(signUp.contact.email));
			row.setPhone(maskInfo(signUp.contact.phone));
			row.setSignUpDate(formatDate(signUp.createdAt));
			row.setUtmSource(signUp?.utmParams?.source);
			row.setUtmMedium(signUp?.utmParams?.medium);

			signUpsTable.addRow(row);
		});

		signUpsSheet.addSignupCommissionsTable(signUpsTable);

		
		// SUMMARY 
		const summarySheet = new CwSummarySheet();
		const commissionsSummaryList = new CommissionsSummaryList();

		commissionsSummaryList.addFrom(formatDate(startDate ? startDate : fromDate));
		commissionsSummaryList.addTo(formatDate(endDate ? endDate : toDate));
		commissionsSummaryList.addPromoterId(promoter.promoterId);
		commissionsSummaryList.addPromoterName(promoter.name);
		commissionsSummaryList.addPurchases(Number(totalPurchases));
		commissionsSummaryList.addSignups(Number(totalSignUps));
		commissionsSummaryList.addPurchases(Number(totalPurchases));
		commissionsSummaryList.addCommissionOnSignups(Number(totalSignUpCommission));
		commissionsSummaryList.addCommissionOnPurchases(Number(totalPurchaseCommission));
		
		commissionsSummaryList.addRevenue(Number(totalRevenue));
		commissionsSummaryList.addTotalCommission(Number(totalSignUpCommission + totalPurchaseCommission));

		summarySheet.addCommissionsSummaryList(commissionsSummaryList);

		commissionWorkbook.addCwSummary(summarySheet);
		commissionWorkbook.addCwPurchases(purchasesSheet);
		commissionWorkbook.addCwSignups(signUpsSheet);

		return commissionWorkbook;

	}
}
