import { MemberRow, MemberTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { JSONObject } from "@org-quicko/core";
import { defaultQueryOptions } from "src/constants";
import { PromoterMember } from "src/entities";
import { QueryOptionsInterface } from "src/interfaces";

export class MemberTableConverter {
	convertFrom(
		memberTable: MemberTable,
		promoterMembers: PromoterMember[], 
		promoterId: string, 
		count: number, 
		queryOptions: QueryOptionsInterface = defaultQueryOptions
	) {
		promoterMembers.forEach((promoterMember) => {
			const member = promoterMember.member;
			
			const row = new MemberRow([]);

			row.setMemberId(member.memberId);
			row.setFirstName(member.firstName);
			row.setLastName(member.lastName);
			row.setEmail(member.email);
			row.setRole(promoterMember.role);
			row.setAddedOn(promoterMember.createdAt.toISOString());

			memberTable.addRow(row);
		});

		memberTable.setMetadata(new JSONObject({
			promoterId,
			...queryOptions,
			count
		}));
	}
}