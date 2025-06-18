import { SignupRow, SignupTable } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { Commission, SignUp } from "../../entities";
import { formatDate, maskInfo } from "../../utils";
import { ConverterException } from "@org-quicko/core";

export class SignUpTableConverter {
	convertTo(
		signUpsTable: SignupTable, 
		signUpsCommissions: Map<string, Commission>,
		signUps: SignUp[]
	) {
		try {
			signUps.forEach((signUp) => {
				const row = new SignupRow([]);
	
				const commission = signUpsCommissions.get(signUp.contactId);
				const commissionAmount = commission?.amount ?? 0;
	
				row.setContactId(signUp.contact.contactId);
				row.setCommission(commissionAmount);
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
			
		} catch (error) {
			throw new ConverterException('Error converting sign-ups to table', error);
		}
	}
}