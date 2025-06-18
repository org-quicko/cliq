import { MemberRow, MemberTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { JSONObject } from "@org-quicko/core";
import { defaultQueryOptions } from "../../constants";
import { PromoterMember } from "../../entities";
import { QueryOptionsInterface } from "../../interfaces";
import { ConverterException } from '@org-quicko/core';

export class MemberTableConverter {
	convertFrom(
		memberTable: MemberTable,
		promoterMembers: PromoterMember[],
		promoterId: string,
		count: number,
		queryOptions: QueryOptionsInterface = defaultQueryOptions
	) {
		try {
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
		} catch (error) {
			throw new ConverterException('Failed to convert to Member Table', error);
		}
	}
}