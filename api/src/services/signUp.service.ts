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
import { SIGNUP_CREATED, SignUpCreatedEvent } from '../events';
import { referralKeyTypeEnum, linkStatusEnum, triggerEnum } from '../enums';
import { LoggerService } from './logger.service';
import { ApiKeyService } from './apiKey.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgramPromoterService } from './programPromoter.service';
import { signUpEntityName } from '../constants';
import { SignUpConverter } from 'src/converters/signup/signUp.dto.converter';

@Injectable()
export class SignUpService {
	constructor(
		@InjectRepository(SignUp)
		private readonly signUpRepository: Repository<SignUp>,

		private linkService: LinkService,
		private programPromoterService: ProgramPromoterService,
		private contactService: ContactService,
		private apiKeyService: ApiKeyService,

		private signUpConverter: SignUpConverter,

		private eventEmitter: EventEmitter2,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	/**
	 * Create SignUp
	 */
	async createSignUp(apiKeyId: string, programId: string, body: CreateSignUpDto) {
		try {
			const { savedSignUp, savedContact, linkResult } = await this.datasource.transaction(async (manager) => {
				this.logger.info(`START: createSignUp service`);
	
				const linkResult = await this.linkService.getLinkEntityByRefVal(
					body.refVal,
					programId,
					{
						// only active links must trigger functions, if they do
						status: linkStatusEnum.ACTIVE
					}
				);
	
				if (!linkResult.programId) {
					this.logger.error(`Failed to get program for ref val ${body.refVal} for signup creation.`);
					throw new NotFoundException(`Failed to get program for ref val ${body.refVal} for signup creation.`);
				}
				if (!linkResult.promoterId) {
					this.logger.error(`Failed to get promoter for ref val ${body.refVal} for signup creation.`);
					throw new NotFoundException(`Failed to get promoter for ref val ${body.refVal} for signup creation.`);
				}
				
				const validApiKeyOfProgram = await this.apiKeyService.keyExistsInProgram(linkResult.programId, apiKeyId);
				if (!validApiKeyOfProgram) {
					this.logger.error(`Error. Provided API key is not part of Program ${linkResult.programId}.`);
					throw new ForbiddenException(`Error. Provided API key is not part of Program ${linkResult.programId}`);
				}
				const programResult = linkResult.program;
	
				const createContactBody: CreateContactDto = {
					programId: linkResult.programId,
					email: body?.email,
					firstName: body?.firstName,
					lastName: body?.lastName,
					phone: body?.phone,
					externalId: body?.externalId
				};
	
				if (
					!this.contactService.verifyReferralKeyInput(
						programResult.referralKeyType,
						createContactBody,
					)
				) {
					this.logger.error(`Error. Program ${programResult.programId} referral key "${programResult.referralKeyType}" absent from request.`);
					throw new BadRequestException(`Error. Program ${programResult.programId} referral key "${programResult.referralKeyType}" absent from request.`);
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
					this.logger.error('Error. Failed to create contact - contact already exists.');
					throw new ConflictException('Error. Failed to create contact - contact already exists.');
				}
	
				const newContact = contactRepository.create({
					...createContactBody,
					program: programResult,
				});
				const savedContact = await contactRepository.save(newContact);
	
				if (!savedContact) {
					this.logger.error(`Error. Failed to create new contact.`);
					throw new InternalServerErrorException(`Error. Failed to create new contact.`);
				}
	
				const newSignUp = signUpRepository.create({
					contact: savedContact,
					link: linkResult,
					promoterId: linkResult.promoterId,
					utmParams: body.utmParams
				});
	
				const savedSignUp = await signUpRepository.save(newSignUp);
	
				if (!savedSignUp) {
					this.logger.error(`Error. Failed to create new signup.`);
					throw new InternalServerErrorException(`Error. Failed to create new signup.`);
				}
	
				return { savedSignUp, savedContact, linkResult }
			});

			const signUpCreatedEvent = new SignUpCreatedEvent(
				savedContact.programId,
				'urn:POST:/signups',
				{
					[signUpEntityName]: {
						"@entity": signUpEntityName,
						contactId: savedContact.contactId,
						triggerType: triggerEnum.SIGNUP,
						promoterId: linkResult.promoterId,
						linkId: linkResult.linkId,
						createdAt: savedSignUp.createdAt,
						updatedAt: savedSignUp.updatedAt,
						utmParams: savedSignUp.utmParams,
					}
				},
				savedSignUp.contactId,
			);

			this.eventEmitter.emit(SIGNUP_CREATED, signUpCreatedEvent);

			const signUpDto = this.signUpConverter.convert(savedSignUp);

			this.logger.info(`END: createSignUp service`);
			return signUpDto;
		} catch (error) {
			this.logger.error(`Error while creating sign up: ${error.message}`);
			if (error instanceof NotFoundException ||
				error instanceof ConflictException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			} else {
				throw new InternalServerErrorException(`Error while creating sign up: ${error.message}`);
			}
		}
	}
}
