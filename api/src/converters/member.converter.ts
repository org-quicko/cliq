import { Injectable } from '@nestjs/common';
import { MemberDto } from '../dtos';
import { Member, PromoterMember } from '../entities';
import { formatDate } from 'src/utils';
import { JSONObject } from '@org.quicko/core';
import { QueryOptionsInterface } from 'src/interfaces/queryOptions.interface';
import { defaultQueryOptions } from 'src/constants';
import { MemberRow, MemberSheet, MemberTable, PromoterWorkbook } from 'generated/sources/Promoter';

@Injectable()
export class MemberConverter {
	public convert(member: Member, promoterMember?: PromoterMember): MemberDto {
		const memberDto = new MemberDto();

		memberDto.memberId = member.memberId;

		memberDto.email = member.email;
		memberDto.firstName = member.firstName;
		memberDto.lastName = member.lastName;
		memberDto.role = promoterMember?.role;
		memberDto.status = promoterMember?.status;

		memberDto.createdAt = member.createdAt;
		memberDto.updatedAt = member.updatedAt;

		return memberDto;
	}

	convertToSheetJson(promoterMembers: PromoterMember[], promoterId: string, count: number, queryOptions: QueryOptionsInterface = defaultQueryOptions): PromoterWorkbook {

		const memberTable = new MemberTable();
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

		memberTable.metadata = new JSONObject({
			promoterId,
			...queryOptions,
			count
		});

		const membersSheet = new MemberSheet();
		membersSheet.addMemberTable(memberTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(membersSheet);

		return promoterWorkbook;
	}
}
