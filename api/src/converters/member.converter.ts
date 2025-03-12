import { Injectable } from '@nestjs/common';
import { MemberDto } from '../dtos';
import { Member, PromoterMember } from '../entities';
import { MemberRow, MemberSheet, MemberTable, PromoterWorkbook } from 'generated/sources';
import { formatDate } from 'src/utils/formatDate.util';

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

	getSheetRow(member: Member, promoterMember: PromoterMember): MemberRow {
		const row = new MemberRow([]);

		row.setMemberId(member.memberId);
		row.setFirstName(member.firstName);
		row.setLastName(member.lastName);
		row.setEmail(member.email);
		row.setRole(promoterMember.role);
		row.setAddedOn(formatDate(promoterMember.createdAt));

		return row;
	}

	convertToSheetJson(promoterMembers: PromoterMember[]): PromoterWorkbook {

		const memberTable = new MemberTable();
		promoterMembers.forEach((promoterMember) => {
			const member = promoterMember.member;
			const row = this.getSheetRow(member, promoterMember);
			memberTable.addRow(row);
		})

		const membersSheet = new MemberSheet();
		membersSheet.addMemberTable(memberTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(membersSheet);

		return promoterWorkbook;
	}
}
