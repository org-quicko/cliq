import {
  BadRequestException, Injectable, InternalServerErrorException,
  // Logger,
  NotFoundException
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { Contact, Purchase } from '../entities';
import { CreateContactDto, CreatePurchaseDto } from '../dtos';
import { LinkService } from './link.service';
import { ContactService } from './contact.service';
import { PurchaseConverter } from '../converters/purchase.converter';
import { contactStatusEnum, referralKeyTypeEnum, triggerEnum } from '../enums';
import { LoggerService } from './logger.service';
import { TRIGGER_EVENT, TriggerEvent } from '../events/trigger.event';

@Injectable()
export class PurchaseService {

  constructor(
    private linkService: LinkService,
    private contactService: ContactService,

    private purchaseConverter: PurchaseConverter,

    private eventEmitter: EventEmitter2,

    private datasource: DataSource,

    private logger: LoggerService,
  ) { }

  /**
   * Create Purchase
   */
  async createPurchase(body: CreatePurchaseDto) {

    return this.datasource.transaction(async (manager) => {
      const linkResult = await this.linkService.getLinkEntity(body.linkId, { program: true, promoter: true });

      if (!linkResult.program) {
        this.logger.error(`Failed to get program for link ${body.linkId} for purchase creation.`);
        throw new NotFoundException(`Failed to get program for link ${body.linkId} for purchase creation.`);
      }
      if (!linkResult.promoter) {
        this.logger.error(`Failed to get promoter for link ${body.linkId} for purchase creation.`);
        throw new NotFoundException(`Failed to get promoter for link ${body.linkId} for purchase creation.`);
      }

      const programResult = linkResult.program;
      const promoterResult = linkResult.promoter;

      const createContactBody: CreateContactDto = {
        programId: programResult.programId,
        email: body?.email,
        firstName: body?.firstName,
        lastName: body?.lastName,
        phone: body?.phone,
      };

      if (!(this.contactService.verifyReferralKeyInput(programResult.referralKeyType, createContactBody))) {
        throw new BadRequestException(`Error. Program ${programResult.programId} referral key "${programResult.referralKeyType}" absent from request.`);
      }

      const contactRepository = manager.getRepository(Contact);
      const purchaseRepository = manager.getRepository(Purchase);

      let associatedContact = await this.contactService.contactExists(programResult.programId, {
        ...(programResult.referralKeyType === referralKeyTypeEnum.EMAIL
          ? { email: body.email }
          : { phone: body.phone })
      });

      if (!associatedContact) {
        associatedContact = contactRepository.create({
          ...createContactBody,
          program: programResult,
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
        externalId: body.externalId,
        itemId: body.itemId,
      });

      const savedPurchase = await purchaseRepository.save(newPurchase);

      if (!savedPurchase) {
        this.logger.error(`Error. Failed to create new purchase.`);
        throw new InternalServerErrorException(`Error. Failed to create new purchase.`);
      }

      await contactRepository.update(
        { contactId: associatedContact.contactId },
        { status: contactStatusEnum.ACTIVE, updatedAt: () => `NOW()` }
      );

      const signUpCreatedEvent = new TriggerEvent(
        triggerEnum.PURCHASE,
        associatedContact.contactId,
        promoterResult.promoterId,
        programResult.programId,
        savedPurchase.externalId,
        undefined,
        savedPurchase.amount,
      );
      this.eventEmitter.emit(TRIGGER_EVENT, signUpCreatedEvent);

      return this.purchaseConverter.convert(savedPurchase);
    }).then(async (result) => {
      // Ensure the refresh runs after the transaction is fully committed
      this.logger.info('Transaction committed. Refreshing materialized view...');
      await this.datasource.query(`REFRESH MATERIALIZED VIEW referral_mv;`);
      await this.datasource.query(`REFRESH MATERIALIZED VIEW referral_mv_program;`);
      return result;
    }).catch((error) => {
      if (error instanceof Error) {
        this.logger.error('Error during purchase creation:', error.message);
        throw error;
      }
    });


  }
}
