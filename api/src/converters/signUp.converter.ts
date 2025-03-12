import { Injectable } from '@nestjs/common';
import { SignUpDto } from '../dtos';
import { Promoter, SignUp } from '../entities';
import { PromoterWorkbook, SignupRow, SignupSheet, SignupsRow, SignupsSummaryList, SignupTable, SignUpWorkbook, SwSignupsSheet, SwSummarySheet } from 'generated/sources';
import { maskInfo } from 'src/utils';
import { isBefore, isAfter } from 'date-fns';
import { SignupsTable } from '../../generated/sources/tables/signups-table/SignupsTable';
import { conversionTypeEnum } from 'src/enums';
import { formatDate } from 'src/utils/formatDate.util';

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

	getSheetRow(signUp: SignUp): SignupRow {
		const newSignUpRow = new SignupRow([]);

		newSignUpRow.setContactId(signUp.contactId);
		newSignUpRow.setFirstName(signUp.contact.firstName);
		newSignUpRow.setLastName(signUp.contact.lastName);
		newSignUpRow.setEmail(maskInfo(signUp.contact.email));
		newSignUpRow.setPhone(maskInfo(signUp.contact.phone));
		newSignUpRow.setLinkId(signUp.link.linkId);
		newSignUpRow.setCreatedAt(signUp.createdAt.toISOString());

		return newSignUpRow;
	}

	convertToSheetJson(signUps: SignUp[]): PromoterWorkbook {
		const newSignUpTable = new SignupTable();

		signUps.forEach((signUp) => {
			const newSignUpRow = this.getSheetRow(signUp);
			newSignUpTable.addRow(newSignUpRow);
		})

		const signUpSheet = new SignupSheet();
		signUpSheet.addSignupTable(newSignUpTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(signUpSheet);

		return promoterWorkbook;
	}

	

	convertToReportWorkbook(
		signUps: SignUp[], 
		promoter: Promoter, 
		startDate?: Date, 
		endDate?: Date,
	): SignUpWorkbook {
		const signUpWorkbook = new SignUpWorkbook();
		
		const signupsSheet = new SwSignupsSheet();
		const signupsTable = new SignupsTable();
		const totalSignUps = signUps.length;
		let totalCommission = 0;

		let fromDate: Date = signUps[0].createdAt;
		let toDate: Date = signUps[0].createdAt;

		signUps.forEach((signUp) => {
			const row = new SignupsRow([]);
			const commission = signUp.contact.commissions.find(commission => commission.conversionType === conversionTypeEnum.SIGNUP);
			totalCommission += commission?.amount ?? 0;

			if (!startDate && !endDate) {
				fromDate = isBefore(signUp.createdAt, fromDate) ? signUp.createdAt : fromDate;
				toDate = isAfter(signUp.createdAt, toDate) ? signUp.createdAt : toDate;
			}			

			row.setCommission(commission?.amount ?? 0);
			row.setContactId(signUp.contactId);
			row.setEmail(maskInfo(signUp.contact.email));
			row.setPhone(maskInfo(signUp.contact.phone));
			row.setSignUpDate(formatDate(signUp.createdAt));
			row.setUtmSource(signUp?.utmParams?.source);
			row.setUtmMedium(signUp?.utmParams?.medium);

			signupsTable.addRow(row);
		});

		signupsSheet.addSignupsTable(signupsTable);

		const summarySheet = new SwSummarySheet();
		const signUpsSummaryList = new SignupsSummaryList();

		signUpsSummaryList.addFrom(formatDate(startDate ? startDate : fromDate));
		signUpsSummaryList.addTo(formatDate(endDate ? endDate : toDate));
		signUpsSummaryList.addPromoterId(promoter.promoterId);
		signUpsSummaryList.addPromoterName(promoter.name);
		signUpsSummaryList.addSignups(Number(totalSignUps));
		signUpsSummaryList.addTotalCommission(Number(totalCommission));

		summarySheet.addSignupsSummaryList(signUpsSummaryList);

		signUpWorkbook.addSwSummary(summarySheet);
		signUpWorkbook.addSwSignups(signupsSheet);

		return signUpWorkbook;

	}
}
