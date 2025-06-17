import { SignupRow, SignupTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { SignUp } from "src/entities";
import { maskInfo } from "src/utils";

export class SignUpTableConverter {
	convertFrom(
		signUpTable: SignupTable, 
		signUps: SignUp[]
	) {
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
	}
}