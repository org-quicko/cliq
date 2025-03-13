import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../dtos';
import { Commission, Promoter, Purchase, SignUp } from '../entities';
import { CommissionRow, CommissionsSheet, CommissionsSummaryList, CommissionTable, CommissionWorkbook, CwPurchasesSheet, CwSignupsSheet, CwSummarySheet, PromoterInterfaceWorkbook, PurchaseCommissionsRow, PurchaseCommissionsTable, SignupCommissionsRow, SignupCommissionsTable } from 'generated/sources';
import { conversionTypeEnum } from 'src/enums';
import { maskInfo } from 'src/utils';
import { formatDate } from 'src/utils';

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

	convertToSheet(commissions: Commission[]): PromoterInterfaceWorkbook {
		const newCommissionTable = new CommissionTable();

		commissions.forEach((commission) => {
			const newCommissionRow = this.getSheetRow(commission);
			newCommissionTable.addRow(newCommissionRow);
		});


		const commissionSheet = new CommissionsSheet();
		commissionSheet.addCommissionTable(newCommissionTable);

		const promoterWorkbook = new PromoterInterfaceWorkbook();
		promoterWorkbook.addSheet(commissionSheet);

		return promoterWorkbook;
	}

	convertToReportWorkbook(
		signUps: SignUp[],
		purchases: Purchase[],
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): CommissionWorkbook {
		const commissionWorkbook = new CommissionWorkbook();

		// PURCHASES
		const purchasesSheet = new CwPurchasesSheet();
		const purchasesTable = new PurchaseCommissionsTable();

		const totalPurchases = purchases.length;
		
		let totalPurchaseCommission: number = 0;
		let totalRevenue: number = 0;

		purchases.forEach((purchase) => {
			const row = new PurchaseCommissionsRow([]);

			let commissionAmount = 0;
			purchase.contact.commissions.forEach((commission) => {
				commissionAmount += commission.amount;
			});

			totalPurchaseCommission += Number(commissionAmount);
			totalRevenue += Number(purchase.amount);

			row.setPurchaseId(purchase.purchaseId);
			row.setPurchaseDate(formatDate(purchase.createdAt));
			row.setContactId(purchase.contact.contactId);
			row.setCommission(Number(commissionAmount));
			row.setItemId(purchase.itemId);
			row.setAmount(Number(purchase.amount));
			row.setExternalId(purchase.contact.externalId);
			row.setUtmId(purchase?.utmParams?.utmId);
			row.setUtmSource(purchase?.utmParams?.utmSource);
			row.setUtmMedium(purchase?.utmParams?.utmMedium);
			row.setUtmCampaign(purchase?.utmParams?.utmCampaign);
			row.setUtmTerm(purchase?.utmParams?.utmTerm);
			row.setUtmContent(purchase?.utmParams?.utmContent);

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

			row.setContactId(signUp.contact.contactId);
			row.setCommission(Number(commissionAmount));
			row.setEmail(maskInfo(signUp.contact.email));
			row.setPhone(maskInfo(signUp.contact.phone));
			row.setSignUpDate(formatDate(signUp.createdAt));
			row.setExternalId(signUp.contact.externalId);
			row.setUtmId(signUp?.utmParams?.utmId);
			row.setUtmSource(signUp?.utmParams?.utmSource);
			row.setUtmMedium(signUp?.utmParams?.utmMedium);
			row.setUtmCampaign(signUp?.utmParams?.utmCampaign);
			row.setUtmTerm(signUp?.utmParams?.utmTerm);
			row.setUtmContent(signUp?.utmParams?.utmContent);

			signUpsTable.addRow(row);
		});

		signUpsSheet.addSignupCommissionsTable(signUpsTable);

		
		// SUMMARY 
		const summarySheet = new CwSummarySheet();
		const commissionsSummaryList = new CommissionsSummaryList();

		commissionsSummaryList.addFrom(formatDate(startDate));
		commissionsSummaryList.addTo(formatDate(endDate));
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
