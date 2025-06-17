import { Commission, Promoter, Purchase, SignUp } from '../../entities';
import { CommissionWorkbook } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { PurchaseTableConverter } from './purchase.table.converter';
import { SignUpTableConverter } from './signup.table.converter';
import { CommissionSummaryListConverter } from './commission_summary.list.converter';

export class CommissionWorkbookConverter {
	// /** For getting commissions data for the promoter */
	// convertToSheet(commissions: Commission[], referralKeyType: referralKeyTypeEnum, metadata: { count: number }): PromoterWorkbook {
	// 	const newCommissionTable = new CommissionTable();

	// 	if (commissions && commissions.length > 0) {
	// 		commissions.forEach((commission) => {
	// 			const row = new CommissionRow([]);
	
	// 			const referral = (referralKeyType === referralKeyTypeEnum.EMAIL) ? commission.contact.email : commission.contact.phone;

	// 			row.setCommissionId(commission.commissionId);
	// 			row.setContactId(commission.contact.contactId);
	// 			row.setCommission(Number(commission.amount));
	// 			row.setConversionType(commission.conversionType);
	// 			row.setRevenue(Number(commission.revenue ?? 0));
	// 			row.setCreatedAt(commission.createdAt.toISOString());
	// 			row.setUpdatedAt(commission.updatedAt.toISOString());
	// 			row.setLinkId(commission.linkId);
	// 			row.setReferral(maskInfo(referral));
	
	// 			newCommissionTable.addRow(row);
	// 		});
	// 	}

	// 	newCommissionTable.setMetadata(new JSONObject(metadata));

	// 	const commissionSheet = new CommissionSheet();
	// 	commissionSheet.addCommissionTable(newCommissionTable);

	// 	const promoterWorkbook = new PromoterWorkbook();
	// 	promoterWorkbook.addSheet(commissionSheet);

	// 	return promoterWorkbook;
	// }
	
	private purchaseTableConverter: PurchaseTableConverter;

	private signUpTableConverter: SignUpTableConverter;

	private commissionsSummaryListConverter: CommissionSummaryListConverter;
	
	constructor() {
		this.purchaseTableConverter = new PurchaseTableConverter();
		this.signUpTableConverter = new SignUpTableConverter();
		this.commissionsSummaryListConverter = new CommissionSummaryListConverter();
	}

	/** For getting commissions report for the promoter */
	convertFrom(
		signUps: SignUp[],
		purchases: Purchase[],
		signUpsCommissions: Map<string, Commission>,
		purchasesCommissions: Map<string, Commission[]>,
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): CommissionWorkbook {
		const commissionWorkbook = new CommissionWorkbook();

		// PURCHASES SHEET
		const purchasesSheet = commissionWorkbook.getPurchaseSheet();

		this.purchaseTableConverter.convertFrom(
			purchasesSheet.getPurchaseTable(),
			purchasesCommissions,
			purchases
		);
		const totalPurchases = purchases.length;
		let totalRevenue = 0;
		const totalPurchaseCommission = purchases.reduce((acc, purchase) => {
			let commissionAmount = 0;

			purchasesCommissions.get(purchase.purchaseId)!.forEach((commission) => {
				commissionAmount += Number(commission.amount);
			});

			totalRevenue += purchase.amount;
			return acc + commissionAmount;

		}, 0);
		

		// SIGNUPS SHEET
		const signUpsSheet = commissionWorkbook.getSignupSheet();

		const totalSignUps = signUps.length;
		const totalSignUpCommission = signUps.reduce((acc, signUp) => {
			const commission = signUpsCommissions.get(signUp.contactId);
			const commissionAmount = commission?.amount ?? 0;

			return acc + commissionAmount;
		}, 0);

		this.signUpTableConverter.convertTo(
			signUpsSheet.getSignupTable(),
			signUpsCommissions,
			signUps,
		);

		// COMMISSION SUMMARY SHEET
		this.commissionsSummaryListConverter.convertFrom({
			commissionsSummaryList: commissionWorkbook.getCommissionSummarySheet().getCommissionSummaryList(),
			startDate,
			endDate,
			promoterId: promoter.promoterId,
			promoterName: promoter.name,
			totalPurchases,
			totalSignUps,
			totalSignUpCommission,
			totalPurchaseCommission,
			totalRevenue
		})

		return commissionWorkbook;

	}
}
