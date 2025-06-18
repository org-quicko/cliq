import { CommissionSummaryList } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { formatDate } from "../../utils";
import { Commission, Purchase, SignUp } from "../../entities";
import { ConverterException } from "@org-quicko/core";

export interface ICommissionSummaryListConverterInput {
	commissionsSummaryList: CommissionSummaryList, 
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	signUpsCommissions: Map<string, Commission>,
	purchasesCommissions: Map<string, Commission[]>,
	signUps: SignUp[],
	purchases: Purchase[],
}

export class CommissionSummaryListConverter {
	convertFrom({
		commissionsSummaryList,
		startDate,
		endDate,
		promoterId,
		promoterName,
		signUpsCommissions,
		purchasesCommissions,
		signUps,
		purchases
	}: ICommissionSummaryListConverterInput) {

		try {
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
	
			const totalSignUps = signUps.length;
			const totalSignUpCommission = signUps.reduce((acc, signUp) => {
				const commission = signUpsCommissions.get(signUp.contactId);
				const commissionAmount = commission?.amount ?? 0;
	
				return acc + commissionAmount;
			}, 0);
	
			commissionsSummaryList.addFrom(formatDate(startDate));
			commissionsSummaryList.addTo(formatDate(endDate));
			commissionsSummaryList.addPromoterId(promoterId);
			commissionsSummaryList.addPromoterName(promoterName);
			commissionsSummaryList.addPurchases(totalPurchases);
			commissionsSummaryList.addSignups(totalSignUps);
			commissionsSummaryList.addPurchases(totalPurchases);
			commissionsSummaryList.addCommissionOnSignups(totalSignUpCommission);
			commissionsSummaryList.addCommissionOnPurchases(totalPurchaseCommission);
	
			commissionsSummaryList.addRevenue(totalRevenue);
			commissionsSummaryList.addTotalCommission(totalSignUpCommission + totalPurchaseCommission);
		
		} catch (error) {
			throw new ConverterException('Failed to convert to CommissionSummaryList', error);	
		}
	}
}