import { Injectable } from '@nestjs/common';
import { MemberDto } from '../dtos';
import { Member, PromoterMember } from '../entities';
import { formatDate } from 'src/utils';
import { JSONObject } from '@org-quicko/core';
import { QueryOptionsInterface } from 'src/interfaces/queryOptions.interface';
import { defaultQueryOptions } from 'src/constants';

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
}
