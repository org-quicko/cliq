import { Injectable } from '@nestjs/common';
import { SignUpDto } from '../dtos';
import { SignUp } from '../entities';
import { PromoterWorkbook, SignupRow, SignupSheet, SignupTable } from 'generated/sources';
import { maskInfo } from 'src/utils';

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
}
