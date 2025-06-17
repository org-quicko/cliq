import { SignupRow, SignupTable } from "@org-quicko/cliq-sheet-core/SignUp/beans";
import { Commission, SignUp } from "../../entities";
import { formatDate, maskInfo } from "../../utils";

export class SignUpTableConverter {
	convertFrom(
		signUpsTable: SignupTable, 
		signUpsCommissions: Map<string, Commission>,
		signUps: SignUp[]
	) {
		signUps.forEach((signUp) => {
			const row = new SignupRow([]);

			const commission = signUpsCommissions.get(signUp.contactId);

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

			signUpsTable.addRow(row);
		});
	}
}