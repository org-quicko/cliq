import { Injectable } from '@nestjs/common';
import { ContactDto } from '../dtos';
import { Contact } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class ContactConverter {
	convert(contact: Contact): ContactDto {
		try {
			const contactDto = new ContactDto();

			contactDto.contactId = contact.contactId;

			contactDto.firstName = contact.firstName;
			contactDto.lastName = contact.lastName;
			contactDto.email = contact.email;
			contactDto.phone = contact.phone;
			contactDto.status = contact.status;
			contactDto.programId = contact.program.programId;

			contactDto.createdAt = new Date(contact.createdAt);
			contactDto.updatedAt = new Date(contact.updatedAt);

			return contactDto;
		} catch (error) {
			throw new ConverterException('Error converting Contact entity to ContactDto', error);
		}
	}
}
