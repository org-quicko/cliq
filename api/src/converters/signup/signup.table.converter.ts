import { SignupRow, SignupTable } from "@org-quicko/cliq-sheet-core/SignUp/beans";
import { Commission, SignUp } from "../../entities";
import { formatDate, maskInfo } from "../../utils";
import { ConverterException } from '@org-quicko/core';

export class SignUpTableConverter {
	convertFrom(
		signUpsCommissions: Map<string, Commission>,
		signUps: SignUp[]
	) {
		try {
			const signUpsTable = new SignupTable();

			signUps.forEach((signUp) => {
				const row = new SignupRow([]);

				const commission = signUpsCommissions.get(signUp.contactId);

				row.setContactId(signUp.contactId);
				row.setSignUpDate(formatDate(signUp.createdAt));
				row.setEmail(maskInfo(signUp.contact.email));
				row.setPhone(maskInfo(signUp.contact.phone));
				row.setCommission(Number(commission?.amount ?? 0));
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
			throw new ConverterException('Failed to convert to Signup Table', error);
		}
	}
}