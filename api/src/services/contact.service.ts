import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../entities';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateContactDto } from '../dtos';
import { ContactConverter } from '../converters/contact.converter';
import { ProgramService } from './program.service';
import { contactStatusEnum, referralKeyTypeEnum } from '../enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CONTACT_CREATED, ContactCreatedEvent } from 'src/events/ContactCreated.event';
import { contactEntityName } from 'src/constants';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

@Injectable()
export class ContactService {
	private logger: winston.Logger = LoggerFactory.getLogger(ContactService.name);
	constructor(
		@InjectRepository(Contact)
		private readonly contactRepository: Repository<Contact>,

		private programService: ProgramService,

		private contactConverter: ContactConverter,

		private eventEmitter: EventEmitter2,

	) {}

	/**
	 * Create contact
	 */
	async createContact(body: CreateContactDto) {
		this.logger.info('START: createContact service');

		const programResult = await this.programService.getProgramEntity(
			body.programId,
		);

		const newContact = this.contactRepository.create({
			email: body?.email,
			firstName: body?.firstName,
			lastName: body?.lastName,
			phone: body?.phone,
			program: programResult,
			status: body?.status,
			// status defaults to LEAD in database
		});

		const savedContact = await this.contactRepository.save(newContact);

		const contactCreatedEvent = new ContactCreatedEvent(
			programResult.programId,
			'urn:in.org.quicko.cliq',
			{
					"@entity": contactEntityName,
					contactId: savedContact.contactId,
					email: savedContact.email,
					firstName: savedContact.firstName,
					lastName: savedContact.lastName,
					phone: savedContact.phone,
					createdAt: savedContact.createdAt,
					updatedAt: savedContact.updatedAt,
		
			},
			savedContact.contactId
		);

		this.eventEmitter.emit(CONTACT_CREATED, contactCreatedEvent);

		this.logger.info('END: createContact service');
		return this.contactConverter.convert(savedContact);
	}

	async contactExists(programId: string, whereOptions: FindOptionsWhere<Contact>) {
		this.logger.info('START: contactExists service');

		const contactResult = await this.contactRepository.findOne({
			where: {
				program: {
					programId,
				},
				...whereOptions,
			},
		});

		this.logger.info('END: contactExists service');
		return contactResult;
	}

	async changeContactStatus(contactId: string, status: contactStatusEnum) {
		this.logger.info('START: changeContactStatus service');

		await this.contactRepository.update(contactId, {
			status,
			updatedAt: () => `NOW()`,
		});

		this.logger.info('END: changeContactStatus service');
	}

	verifyReferralKeyInput(
		referralKeyType: referralKeyTypeEnum,
		body: CreateContactDto,
	) {
		this.logger.info('START: verifyReferralKeyInput service');

		let valid: boolean;

		if (
			(referralKeyType === referralKeyTypeEnum.EMAIL && !body.email) ||
			(referralKeyType === referralKeyTypeEnum.PHONE && !body.phone)
		) {
			valid = false;
		} else {
			valid = true;
		}

		this.logger.info('END: verifyReferralKeyInput service');
		return valid;
	}
}
