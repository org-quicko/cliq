import { Injectable } from '@nestjs/common';
import { SignUpDto } from '../../dtos';
import { SignUp } from '../../entities';
import { maskInfo } from '../../utils';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class SignUpConverter {
	convert(signUp: SignUp): SignUpDto {
		try {
			const signUpDto = new SignUpDto();

			signUpDto.contactId = signUp.contactId;

			signUpDto.promoterId = signUp.promoterId;
			signUpDto.linkId = signUp.linkId;
			signUpDto.email = maskInfo(signUp.contact?.email);
			signUpDto.firstName = signUp.contact?.firstName;
			signUpDto.lastName = signUp.contact?.lastName;
			signUpDto.phone = maskInfo(signUp.contact?.phone);
			signUpDto.utmParams = signUp.utmParams;

			signUpDto.createdAt = new Date(signUp.createdAt);
			signUpDto.updatedAt = new Date(signUp.updatedAt);

			return signUpDto;
		} catch (error) {
			throw new ConverterException('Error converting SignUp entity to SignUpDto', error);
		}
	}
}
