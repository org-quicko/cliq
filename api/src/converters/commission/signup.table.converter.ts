import { SignupRow, SignupTable } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { Commission, SignUp } from "../../entities";
import { formatDate, maskInfo } from "../../utils";
import { ConverterException } from "@org-quicko/core";

export class SignUpTableConverter {
	convertTo(
		signUpsCommissions: Map<string, Commission>,
		signUps: SignUp[]
	) {
		try {
			const signUpsTable = new SignupTable();
			signUps.forEach((signUp) => {
				const row = new SignupRow([]);
	
				const commission = signUpsCommissions.get(signUp.contactId);
				const commissionAmount = commission?.amount ?? 0;
	
				row.setContactId(signUp.contact.contactId);
				row.setSignUpDate(formatDate(signUp.createdAt));
				row.setEmail(maskInfo(signUp.contact.email));
				row.setPhone(maskInfo(signUp.contact.phone));
				row.setCommission(Number(commissionAmount) ?? 0);
				row.setExternalId(signUp.contact.externalId || '');
				row.setUtmId(signUp?.utmParams?.utmId || '');
				row.setUtmSource(signUp?.utmParams?.utmSource || '');
				row.setUtmMedium(signUp?.utmParams?.utmMedium || '');
				row.setUtmCampaign(signUp?.utmParams?.utmCampaign || '');
				row.setUtmTerm(signUp?.utmParams?.utmTerm || '');
				row.setUtmContent(signUp?.utmParams?.utmContent || '');
	
				signUpsTable.addRow(row);
			});
			
			return signUpsTable;
			
		} catch (error) {
			throw new ConverterException('Error converting sign-ups to table', error);
		}
	}
}