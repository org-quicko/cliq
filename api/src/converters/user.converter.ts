import { Injectable } from '@nestjs/common';
import { UserDto } from '../dtos';
import { ProgramUser, User } from '../entities';

@Injectable()
export class UserConverter {
	convert(user: User, programUser?: ProgramUser): UserDto {
		const userDto = new UserDto();

		userDto.userId = user.userId;

		userDto.email = user.email;
		//  not sending the password
		userDto.firstName = user.firstName;
		userDto.lastName = user.lastName;
		// userDto.role = programUser?.role;
		userDto.status = programUser?.status;
		userDto.role = user.role;

		userDto.createdAt = new Date(user.createdAt);
		userDto.updatedAt = new Date(user.updatedAt);

		return userDto;
	}

	// getSheetRow(member: User, promoterMember: ProgramUser): MemberRow {
	// 	const row = new MemberRow([]);

	// 	row.setMemberId(member.memberId);
	// 	row.setFirstName(member.firstName);
	// 	row.setLastName(member.lastName);
	// 	row.setEmail(member.email);
	// 	row.setRole(promoterMember.role);
	// 	row.setAddedOn(formatDate(promoterMember.createdAt));

	// 	return row;
	// }

	// convertToSheetJson(promoterMembers: ProgramUser[]): PromoterInterfaceWorkbook {

	// 	const memberTable = new MemberTable();
	// 	promoterMembers.forEach((promoterMember) => {
	// 		const member = promoterMember.member;
	// 		const row = this.getSheetRow(member, promoterMember);
	// 		memberTable.addRow(row);
	// 	})

	// 	const membersSheet = new MemberSheet();
	// 	membersSheet.addMemberTable(memberTable);

	// 	const promoterWorkbook = new PromoterInterfaceWorkbook();
	// 	promoterWorkbook.addSheet(membersSheet);

	// 	return promoterWorkbook;
	// }
}
