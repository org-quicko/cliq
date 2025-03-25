import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../dtos';
import { Commission, Promoter, Purchase, SignUp } from '../entities';
import { conversionTypeEnum } from 'src/enums';
import { maskInfo } from 'src/utils';
import { formatDate } from 'src/utils';
import { CommissionRow, CommissionSheet, CommissionTable, PromoterWorkbook } from 'generated/sources/Promoter';
import { 
	CommissionSummaryList, 
	CommissionSummarySheet, 
	CommissionWorkbook, 
	PurchaseCommissionRow, 
	PurchaseCommissionTable, 
	PurchaseSheet, 
	SignupCommissionRow, 
	SignupCommissionTable, 
	SignupSheet 
} from 'generated/sources/Commission';

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

	/** For getting commissions data for the promoter */
	convertToSheet(commissions: Commission[]): PromoterWorkbook {
		const newCommissionTable = new CommissionTable();

		commissions.forEach((commission) => {
			const row = new CommissionRow([]);

			row.setCommissionId(commission.commissionId);
			row.setCommission(Number(commission.amount));
			row.setConversionType(commission.conversionType);
			row.setRevenue(Number(commission.revenue ?? 0));
			row.setCreatedAt(commission.createdAt.toISOString());

			newCommissionTable.addRow(row);
		});


		const commissionSheet = new CommissionSheet();
		commissionSheet.addCommissionTable(newCommissionTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(commissionSheet);

		return promoterWorkbook;
	}

	/** For getting commissions report for the promoter */
	convertToReportWorkbook(
		signUps: SignUp[],
		purchases: Purchase[],
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): CommissionWorkbook {
		const commissionWorkbook = new CommissionWorkbook();

		// PURCHASES
		const purchasesSheet = new PurchaseSheet();
		const purchasesTable = new PurchaseCommissionTable();

		const totalPurchases = purchases.length;

		let totalPurchaseCommission: number = 0;
		let totalRevenue: number = 0;

		purchases.forEach((purchase) => {
			const row = new PurchaseCommissionRow([]);

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

		purchasesSheet.addPurchaseCommissionTable(purchasesTable);


		// SIGNUPS
		const signUpsSheet = new SignupSheet();
		const signUpsTable = new SignupCommissionTable();

		const totalSignUps = signUps.length;

		let totalSignUpCommission = 0;

		signUps.forEach((signUp) => {
			const row = new SignupCommissionRow([]);

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

		signUpsSheet.addSignupCommissionTable(signUpsTable);


		// SUMMARY 
		const summarySheet = new CommissionSummarySheet();
		const commissionsSummaryList = new CommissionSummaryList();

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

		summarySheet.addCommissionSummaryList(commissionsSummaryList);

		commissionWorkbook.addCommissionSummarySheet(summarySheet);
		commissionWorkbook.addPurchaseSheet(purchasesSheet);
		commissionWorkbook.addSignupSheet(signUpsSheet);

		return commissionWorkbook;

	}
}
