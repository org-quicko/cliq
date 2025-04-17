import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { Contact, Purchase } from '../entities';
import { CreateContactDto, CreatePurchaseDto } from '../dtos';
import { LinkService } from './link.service';
import { ContactService } from './contact.service';
import { PurchaseConverter } from '../converters/purchase.converter';
import { contactStatusEnum, referralKeyTypeEnum, linkStatusEnum, triggerEnum } from '../enums';
import { LoggerService } from './logger.service';
import { PURCHASE_CREATED, PurchaseCreatedEvent } from '../events';
import { ApiKeyService } from './apiKey.service';
import { InjectRepository } from '@nestjs/typeorm';
import { purchaseEntityName } from 'src/constants';

@Injectable()
export class PurchaseService {
	constructor(
		@InjectRepository(Purchase)
		private readonly purchaseRepository: Repository<Purchase>,

		private linkService: LinkService,
		private contactService: ContactService,
		private apiKeyService: ApiKeyService,

		private purchaseConverter: PurchaseConverter,

		private eventEmitter: EventEmitter2,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	/**
	 * Create Purchase
	 */
	async createPurchase(apiKeyId: string, programId: string, body: CreatePurchaseDto) {
		return this.datasource.transaction(async (manager) => {
			const linkResult = await this.linkService.getLinkEntityByRefVal(
				body.refVal,
				programId,
				{
					// only active links must trigger functions, if they do
					status: linkStatusEnum.ACTIVE
				}
			);

			if (!linkResult.program) {
				this.logger.error(
					`Failed to get program for ref val ${body.refVal} for purchase creation.`,
				);
				throw new NotFoundException(
					`Failed to get program for ref val ${body.refVal} for purchase creation.`,
				);
			}
			if (!linkResult.promoter) {
				this.logger.error(
					`Failed to get promoter for ref val ${body.refVal} for purchase creation.`,
				);
				throw new NotFoundException(
					`Failed to get promoter for ref val ${body.refVal} for purchase creation.`,
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
			const promoterResult = linkResult.promoter;

			const createContactBody: CreateContactDto = {
				programId: programResult.programId,
				email: body?.email,
				firstName: body?.firstName,
				lastName: body?.lastName,
				phone: body?.phone,
				externalId: body?.externalId,
				status: contactStatusEnum.ACTIVE
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
			const purchaseRepository = manager.getRepository(Purchase);

			let associatedContact = await this.contactService.contactExists(
				programResult.programId,
				{
					...(programResult.referralKeyType ===
						referralKeyTypeEnum.EMAIL
						? { email: body.email }
						: { phone: body.phone }),
				},
			);

			if (!associatedContact) {
				associatedContact = contactRepository.create({
					...createContactBody,
					program: programResult
				});

				associatedContact = await contactRepository.save(associatedContact);

				if (!associatedContact) {
					this.logger.error(`Error. Failed to create new contact.`);
					throw new InternalServerErrorException(`Error. Failed to create new contact.`);
				}
			}

			const newPurchase = purchaseRepository.create({
				amount: body.amount,
				contact: associatedContact,
				link: linkResult,
				promoter: promoterResult,
				itemId: body.itemId,
				utmParams: body.utmParams,
			});

			const savedPurchase = await purchaseRepository.save(newPurchase);

			await contactRepository.update(
				{ contactId: associatedContact.contactId },
				{ status: contactStatusEnum.ACTIVE, updatedAt: () => `NOW()` },
			);

			
			const purchaseCreatedEvent = new PurchaseCreatedEvent(
				associatedContact.programId,
				'urn:POST:/purchases',
				{
					[purchaseEntityName]: {
						"@entity": purchaseEntityName,
						triggerType: triggerEnum.PURCHASE,
						contactId: associatedContact.contactId,
						promoterId: promoterResult.promoterId,
						linkId: linkResult.linkId,
						itemId: savedPurchase.itemId,
						amount: savedPurchase.amount,
						createdAt: savedPurchase.createdAt,
						updatedAt: savedPurchase.updatedAt,
						utmParams: savedPurchase.utmParams,
					}
				},
				savedPurchase.purchaseId,
			);
			
			this.eventEmitter.emit(PURCHASE_CREATED, purchaseCreatedEvent);

			return this.purchaseConverter.convert(savedPurchase);
		});
	}

	async getFirstPurchase(programId?: string, promoterId?: string) {
		this.logger.info('START: getFirstPurchase service');

		if (!programId && !promoterId) {
			throw new BadRequestException(
				`Error. Must pass at least one of Program ID or Promoter ID to get signup result.`,
			);
		}

		const purchaseResult = await this.purchaseRepository.findOne({
			where: {
				...(programId && { contact: { programId } }),
				...(promoterId && { promoterId }),
			},
			relations: {
				contact: true
			}
		});

		if (!purchaseResult) {
			this.logger.warn(`No Purchases found${promoterId ? ` for Promoter ${promoterId}` : ''} in Program ${programId}`);

			throw new NotFoundException(`No Purchases found${promoterId ? ` for Promoter ${promoterId}` : ''} in Program ${programId}`);
		}

		this.logger.info('END: getFirstPurchase service');
		return purchaseResult;
	}
}
