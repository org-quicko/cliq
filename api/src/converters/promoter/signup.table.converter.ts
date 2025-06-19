import { SignupRow, SignupTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { SignUp } from "../../entities";
import { maskInfo } from "../../utils";
import { ConverterException } from '@org-quicko/core';

export class SignUpTableConverter {
	convertFrom(
		signUps: SignUp[]
	) {
		try {
			const signUpTable = new SignupTable();

			signUps.forEach((signUp) => {
				const row = new SignupRow([]);

				row.setContactId(signUp.contactId);
				row.setFirstName(signUp.contact.firstName);
				row.setLastName(signUp.contact.lastName);
				row.setEmail(maskInfo(signUp.contact.email));
				row.setPhone(maskInfo(signUp.contact.phone));
				row.setLinkId(signUp.link.linkId);
				row.setCreatedAt(signUp.createdAt.toISOString());

				signUpTable.addRow(row);
			});

			return signUpTable;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Signup Table', error);
		}
	}
}