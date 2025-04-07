import { Injectable } from '@nestjs/common';
import { CommissionDto } from '../dtos';
import { Commission, Promoter, Purchase, SignUp } from '../entities';
import { conversionTypeEnum, referralKeyTypeEnum } from 'src/enums';
import { maskInfo } from 'src/utils';
import { formatDate } from 'src/utils';
import { CommissionRow, CommissionSheet, CommissionTable, PromoterWorkbook } from 'generated/sources/Promoter';
import { 
	CommissionSummaryList, 
	CommissionSummarySheet, 
	CommissionWorkbook, 
	PurchaseSheet, 
	PurchaseTable,
	PurchaseRow,
	SignupSheet ,
	SignupTable,
	SignupRow
} from 'generated/sources/Commission';
import { JSONObject } from '@org.quicko/core';

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
	convertToSheet(commissions: Commission[], referralKeyType: referralKeyTypeEnum, metadata: { count: number }): PromoterWorkbook {
		const newCommissionTable = new CommissionTable();

		if (commissions && commissions.length > 0) {
			commissions.forEach((commission) => {
				const row = new CommissionRow([]);
	
				const referral = (referralKeyType === referralKeyTypeEnum.EMAIL) ? commission.contact.email : commission.contact.phone;

				row.setCommissionId(commission.commissionId);
				row.setContactId(commission.contact.contactId);
				row.setCommission(Number(commission.amount));
				row.setConversionType(commission.conversionType);
				row.setRevenue(Number(commission.revenue ?? 0));
				row.setCreatedAt(commission.createdAt.toISOString());
				row.setUpdatedAt(commission.updatedAt.toISOString());
				row.setLinkId(commission.linkId);
				row.setReferral(maskInfo(referral));
	
				newCommissionTable.addRow(row);
			});
		}

		newCommissionTable.metadata = new JSONObject(metadata);

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
		const purchasesTable = new PurchaseTable();

		const totalPurchases = purchases.length;

		let totalPurchaseCommission: number = 0;
		let totalRevenue: number = 0;

		purchases.forEach((purchase) => {
			const row = new PurchaseRow([]);

			let commissionAmount = 0;
			purchase.contact.commissions.forEach((commission) => {
				commissionAmount += Number(commission.amount);
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

		purchasesSheet.addPurchaseTable(purchasesTable);


		// SIGNUPS
		const signUpsSheet = new SignupSheet();
		const signUpsTable = new SignupTable();

		const totalSignUps = signUps.length;

		let totalSignUpCommission = 0;

		signUps.forEach((signUp) => {
			const row = new SignupRow([]);

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

		signUpsSheet.addSignupTable(signUpsTable);


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
		commissionsSummaryList.addTotalCommission(Number(totalSignUpCommission) + Number(totalPurchaseCommission));

		summarySheet.addCommissionSummaryList(commissionsSummaryList);

		commissionWorkbook.addCommissionSummarySheet(summarySheet);
		commissionWorkbook.addPurchaseSheet(purchasesSheet);
		commissionWorkbook.addSignupSheet(signUpsSheet);

		return commissionWorkbook;

	}
}
