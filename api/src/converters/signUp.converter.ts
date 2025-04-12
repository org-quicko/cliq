import { Injectable } from '@nestjs/common';
import { SignUpDto } from '../dtos';
import { Commission, Promoter, SignUp } from '../entities';
import { maskInfo } from 'src/utils';
import { conversionTypeEnum } from 'src/enums';
import { formatDate } from 'src/utils';
import { QueryOptionsInterface } from 'src/interfaces/queryOptions.interface';
import { defaultQueryOptions } from 'src/constants';
import { JSONObject } from '@org.quicko/core';
import { 
	PromoterWorkbook, 
	SignupRow as PromoterSignupRow, 
	SignupSheet as PromoterSignupSheet, 
	SignupTable as PromoterSignupTable 
} from 'generated/sources/Promoter';

import { 
	SignUpWorkbook,
	SignupRow,
	SignupSheet,
	SignupSummaryList,
	SignupSummarySheet,
	SignupTable
	
} from 'generated/sources/SignUp';

@Injectable()
export class SignUpConverter {
	convert(signUp: SignUp): SignUpDto {
		const signUpDto = new SignUpDto();

		signUpDto.contactId = signUp.contactId;

		signUpDto.promoterId = signUp.promoterId;
		signUpDto.linkId = signUp.linkId;
		signUpDto.email = maskInfo(signUp.contact?.email);
		signUpDto.firstName = signUp.contact?.lastName;
		signUpDto.lastName = signUp.contact?.lastName;
		signUpDto.phone = maskInfo(signUp.contact?.phone);

		signUpDto.createdAt = new Date(signUp.createdAt);
		signUpDto.updatedAt = new Date(signUp.updatedAt);

		return signUpDto;
	}

	/** For getting signups data for the promoter */
	convertToSheetJson(signUps: SignUp[]): PromoterWorkbook {
		const signUpTable = new PromoterSignupTable();

		signUps.forEach((signUp) => {
			const row = new PromoterSignupRow([]);

			row.setContactId(signUp.contactId);
			row.setFirstName(signUp.contact.firstName);
			row.setLastName(signUp.contact.lastName);
			row.setEmail(maskInfo(signUp.contact.email));
			row.setPhone(maskInfo(signUp.contact.phone));
			row.setLinkId(signUp.link.linkId);
			row.setCreatedAt(signUp.createdAt.toISOString());

			signUpTable.addRow(row);
		});

		const signUpSheet = new PromoterSignupSheet();
		signUpSheet.addSignupTable(signUpTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(signUpSheet);

		return promoterWorkbook;
	}


	/** For getting signups report for the promoter */
	convertToReportWorkbook(
		signUps: SignUp[],
		signUpsCommissions: Map<string, Commission>,
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): SignUpWorkbook {
		const signUpWorkbook = new SignUpWorkbook();

		const signupsSheet = new SignupSheet();
		const signupsTable = new SignupTable();
		const totalSignUps = signUps.length;
		let totalCommission = 0;


		signUps.forEach((signUp) => {
			const row = new SignupRow([]);

			const commission = signUpsCommissions.get(signUp.contactId);
			totalCommission += commission?.amount ?? 0;

			row.setCommission(commission?.amount ?? 0);
			row.setContactId(signUp.contactId);
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

			signupsTable.addRow(row);
		});

		signupsSheet.addSignupTable(signupsTable);

		const summarySheet = new SignupSummarySheet();
		const signUpsSummaryList = new SignupSummaryList();

		signUpsSummaryList.addFrom(formatDate(startDate));
		signUpsSummaryList.addTo(formatDate(endDate));
		signUpsSummaryList.addPromoterId(promoter.promoterId);
		signUpsSummaryList.addPromoterName(promoter.name);
		signUpsSummaryList.addSignups(Number(totalSignUps));
		signUpsSummaryList.addTotalCommission(Number(totalCommission));

		summarySheet.addSignupSummaryList(signUpsSummaryList);

		signUpWorkbook.addSignupSummarySheet(summarySheet);
		signUpWorkbook.addSignupSheet(signupsSheet);

		return signUpWorkbook;

	}
}
