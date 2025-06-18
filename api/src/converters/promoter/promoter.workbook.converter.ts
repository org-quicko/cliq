import { IMemberSheetConverterInput, MemberSheetConverter } from './member.sheet.converter';
import { ILinkAnalyticsSheetConverterInput, LinkAnalyticsSheetConverter } from './link_analytics.sheet.converter';
import { IPurchaseSheetConverterInput, PurchaseSheetConverter } from './purchase.sheet.converter';
import { IPromoterAnalyticsSheetConverterInput, PromoterAnalyticsSheetConverter } from './promoter_analytics.sheet.converter';
import { ISignUpSheetConverterInput, SignUpSheetConverter } from './signup.sheet.converter';
import { IReferralSheetConverterInput, ReferralSheetConverter } from './referral.sheet.converter';
import { CommissionSheetConverter, ICommissionSheetConverterInput } from './commission.sheet.converter';
import { PromoterWorkbook } from '@org-quicko/cliq-sheet-core/Promoter/beans';
import { ConverterException } from '@org-quicko/core';

export interface IPromoterWorkbookConverterInput {
	commissionSheetInput?: ICommissionSheetConverterInput;
	linkAnalyticsInput?: ILinkAnalyticsSheetConverterInput;
	memberSheetInput?: IMemberSheetConverterInput;
	signUpSheetInput?: ISignUpSheetConverterInput;
	promoterAnalyticsSheetInput?: IPromoterAnalyticsSheetConverterInput;
	purchaseSheetInput?: IPurchaseSheetConverterInput;
	referralSheetInput?: IReferralSheetConverterInput;
}

export class PromoterWorkbookConverter {

	private commissionSheetConverter: CommissionSheetConverter;
	private linkAnalyticsSheetConverter: LinkAnalyticsSheetConverter;
	private memberSheetConverter: MemberSheetConverter;
	private signUpSheetConverter: SignUpSheetConverter;
	private promoterAnalyticsSheetConverter: PromoterAnalyticsSheetConverter;
	private purchaseSheetConverter: PurchaseSheetConverter;
	private referralSheetConverter: ReferralSheetConverter;

	convertTo({
		commissionSheetInput,
		linkAnalyticsInput,
		memberSheetInput,
		signUpSheetInput,
		promoterAnalyticsSheetInput,
		purchaseSheetInput,
		referralSheetInput,
	}: IPromoterWorkbookConverterInput) {
		try {
			const promoterWorkbook = new PromoterWorkbook();
			if (commissionSheetInput) {
				this.commissionSheetConverter = new CommissionSheetConverter();
				this.commissionSheetConverter.convertFrom(promoterWorkbook.getCommissionSheet(), commissionSheetInput);
			}
			if (linkAnalyticsInput) {
				this.linkAnalyticsSheetConverter = new LinkAnalyticsSheetConverter();
				this.linkAnalyticsSheetConverter.convertFrom(promoterWorkbook.getLinkAnalyticsSheet(), linkAnalyticsInput);
			}
			if (memberSheetInput) {
				this.memberSheetConverter = new MemberSheetConverter();
				this.memberSheetConverter.convertFrom(promoterWorkbook.getMemberSheet(), memberSheetInput);
			}
			if (signUpSheetInput) {
				this.signUpSheetConverter = new SignUpSheetConverter();
				this.signUpSheetConverter.convertFrom(promoterWorkbook.getSignupSheet(), signUpSheetInput);
			}
			if (promoterAnalyticsSheetInput) {
				this.promoterAnalyticsSheetConverter = new PromoterAnalyticsSheetConverter();
				this.promoterAnalyticsSheetConverter.convertFrom(promoterWorkbook.getPromoterAnalyticsSheet(), promoterAnalyticsSheetInput);
			}
			if (purchaseSheetInput) {
				this.purchaseSheetConverter = new PurchaseSheetConverter();
				this.purchaseSheetConverter.convertFrom(promoterWorkbook.getPurchaseSheet(), purchaseSheetInput);
			}
			if (referralSheetInput) {
				this.referralSheetConverter = new ReferralSheetConverter();
				this.referralSheetConverter.convertFrom(promoterWorkbook.getReferralSheet(), referralSheetInput);
			}
			return promoterWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Workbook', error);
		}
	}
}