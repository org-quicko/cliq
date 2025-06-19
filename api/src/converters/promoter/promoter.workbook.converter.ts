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
				const commissionSheet = this.commissionSheetConverter.convertFrom(commissionSheetInput);
				promoterWorkbook.replaceSheet(commissionSheet);
			}
			if (linkAnalyticsInput) {
				this.linkAnalyticsSheetConverter = new LinkAnalyticsSheetConverter();
				const linkAnalyticsSheet = this.linkAnalyticsSheetConverter.convertFrom(linkAnalyticsInput);
				promoterWorkbook.replaceSheet(linkAnalyticsSheet);
			}
			if (memberSheetInput) {
				this.memberSheetConverter = new MemberSheetConverter();
				const memberSheet = this.memberSheetConverter.convertFrom(memberSheetInput);
				promoterWorkbook.replaceSheet(memberSheet);
			}
			if (signUpSheetInput) {
				this.signUpSheetConverter = new SignUpSheetConverter();
				const signUpSheet = this.signUpSheetConverter.convertFrom(signUpSheetInput);
				promoterWorkbook.replaceSheet(signUpSheet);
			}
			if (promoterAnalyticsSheetInput) {
				this.promoterAnalyticsSheetConverter = new PromoterAnalyticsSheetConverter();
				const promoterAnalyticsSheet = this.promoterAnalyticsSheetConverter.convertFrom(promoterAnalyticsSheetInput);
				promoterWorkbook.replaceSheet(promoterAnalyticsSheet);
			}
			if (purchaseSheetInput) {
				this.purchaseSheetConverter = new PurchaseSheetConverter();
				const purchaseSheet = this.purchaseSheetConverter.convertFrom(purchaseSheetInput);
				promoterWorkbook.replaceSheet(purchaseSheet);
			}
			if (referralSheetInput) {
				this.referralSheetConverter = new ReferralSheetConverter();
				const referralSheet = this.referralSheetConverter.convertFrom(referralSheetInput);
				promoterWorkbook.replaceSheet(referralSheet);
			}
			
			return promoterWorkbook;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Workbook', error);
		}
	}
}