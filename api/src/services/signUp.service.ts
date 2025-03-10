import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contact, SignUp } from '../entities';
import { CreateContactDto, CreateSignUpDto } from '../dtos';
import { LinkService } from './link.service';
import { ContactService } from './contact.service';
import { SignUpConverter } from '../converters/signUp.converter';
import { SIGNUP_EVENT, SignUpEvent } from '../events';
import { referralKeyTypeEnum } from '../enums';
import { LoggerService } from './logger.service';
import { ApiKeyService } from './apiKey.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SignUpService {
	constructor(
		@InjectRepository(SignUp)
		private readonly signUpRepository: Repository<SignUp>,

		private linkService: LinkService,
		private contactService: ContactService,
		private apiKeyService: ApiKeyService,

		private signUpConverter: SignUpConverter,

		private eventEmitter: EventEmitter2,

		private datasource: DataSource,

		private logger: LoggerService,
	) {}

	/**
	 * Create SignUp
	 */
	async createSignUp(apiKeyId: string, body: CreateSignUpDto) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info(`START: createSignUp service`);

			const linkResult = await this.linkService.getLinkEntityByRefVal(
				body.refVal,
			);

			if (!linkResult.programId) {
				this.logger.error(
					`Failed to get program for ref val ${body.refVal} for signup creation.`,
				);
				throw new NotFoundException(
					`Failed to get program for ref val ${body.refVal} for signup creation.`,
				);
			}
			if (!linkResult.promoterId) {
				this.logger.error(
					`Failed to get promoter for ref val ${body.refVal} for signup creation.`,
				);
				throw new NotFoundException(
					`Failed to get promoter for ref val ${body.refVal} for signup creation.`,
				);
			}
			const validApiKeyOfProgram =
				await this.apiKeyService.keyExistsInProgram(
					linkResult.programId,
					apiKeyId,
				);
			if (!validApiKeyOfProgram) {
				this.logger.error(
					`Error. API key ${apiKeyId} is not part of Program ${linkResult.programId}`,
				);
				throw new ForbiddenException(
					`Error. API key ${apiKeyId} is not part of Program ${linkResult.programId}`,
				);
			}

			const programResult = linkResult.program;

			const createContactBody: CreateContactDto = {
				programId: linkResult.programId,
				email: body?.email,
				firstName: body?.firstName,
				lastName: body?.lastName,
				phone: body?.phone,
			};

			if (
				!this.contactService.verifyReferralKeyInput(
					programResult.referralKeyType,
					createContactBody,
				)
			) {
				throw new BadRequestException(
					`Error. Program ${programResult.programId} referral key "${programResult.referralKeyType}" absent from request.`,
				);
			}

			const contactRepository = manager.getRepository(Contact);
			const signUpRepository = manager.getRepository(SignUp);

			const contactExists = await this.contactService.contactExists(
				programResult.programId,
				{
					...(programResult.referralKeyType ===
					referralKeyTypeEnum.EMAIL
						? { email: body.email }
						: { phone: body.phone }),
				},
			);

			if (contactExists) {
				this.logger.error(
					'Error. Failed to create contact - contact already exists.',
				);
				throw new ConflictException(
					'Error. Failed to create contact - contact already exists.',
				);
			}

			const newContact = contactRepository.create({
				...createContactBody,
				program: programResult,
			});
			const savedContact = await contactRepository.save(newContact);

			if (!savedContact) {
				this.logger.error(`Error. Failed to create new contact.`);
				throw new InternalServerErrorException(
					`Error. Failed to create new contact.`,
				);
			}

			const newSignUp = signUpRepository.create({
				contact: savedContact,
				link: linkResult,
				promoterId: linkResult.promoterId,
				externalId: body?.externalId,
			});

			const savedSignUp = await signUpRepository.save(newSignUp);

			if (!savedSignUp) {
				this.logger.error(`Error. Failed to create new signup.`);
				throw new InternalServerErrorException(
					`Error. Failed to create new signup.`,
				);
			}

			const signUpCreatedEvent = new SignUpEvent(
				savedContact.contactId,
				linkResult.promoterId,
				programResult.programId,
			);
			// const signUpCreatedEvent = new TriggerEvent(
			//   triggerEnum.SIGNUP,
			//   savedContact.contactId,
			//   linkResult.promoterId,
			//   programResult.programId,
			// );
			// this.eventEmitter.emit(TRIGGER_EVENT, signUpCreatedEvent);
			this.eventEmitter.emit(SIGNUP_EVENT, signUpCreatedEvent);

			const signUpDto = this.signUpConverter.convert(savedSignUp);

			this.logger.info(`END: createSignUp service`);
			return signUpDto;
		});
	}

	async getFirstSignUp(programId?: string, promoterId?: string) {
		this.logger.info('START: getFirstSignUp service');

		if (!programId && !promoterId) {
			throw new BadRequestException(
				`Error. Must pass at least one of Program ID or Promoter ID to get signup result.`,
			);
		}

		const signUpResult = await this.signUpRepository.findOne({
			where: {
				contact: {
					programId: programId,
				},
				promoterId,
			},
		});

		if (!signUpResult) {
			throw new BadRequestException();
		}

		this.logger.info('END: getFirstSignUp service');
		return signUpResult;
	}
}
