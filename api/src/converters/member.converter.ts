import { Injectable } from '@nestjs/common';
import { MemberDto } from '../dtos';
import { Member, PromoterMember } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class MemberConverter {
	public convert(member: Member, promoterMember?: PromoterMember): MemberDto {
		try {
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
		} catch (error) {
			throw new ConverterException('Error converting Member entity to MemberDto', error);
		}
	}
}
