import {
  BadRequestException, ConflictException, Injectable, InternalServerErrorException,
  // Logger, 
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contact, SignUp } from '../entities';
import { CreateContactDto, CreateSignUpDto } from '../dtos';
import { LinkService } from './link.service';
import { ContactService } from './contact.service';
import { SignUpConverter } from '../converters/signUp.converter';
import { TRIGGER_EVENT, TriggerEvent } from '../events';
import { referralKeyTypeEnum, triggerEnum } from '../enums';
import { LoggerService } from './logger.service';

@Injectable()
export class SignUpService {

  constructor(
    private linkService: LinkService,
    private contactService: ContactService,

    private signUpConverter: SignUpConverter,

    private eventEmitter: EventEmitter2,

    private datasource: DataSource,

    private logger: LoggerService,
  ) { }

  /**
   * Create Purchase
   */
  async createSignUp(body: CreateSignUpDto) {
    return this.datasource.transaction(async (manager) => {
      this.logger.info(`START: createSignUp service`);

      const linkResult = await this.linkService.getLinkEntity(body.linkId, { program: true });

      if (!linkResult.programId) {
        this.logger.error(`Failed to get program for link ${body.linkId} for signup creation.`);
        throw new NotFoundException(`Failed to get program for link ${body.linkId} for signup creation.`);
      }
      if (!linkResult.promoterId) {
        this.logger.error(`Failed to get promoter for link ${body.linkId} for signup creation.`);
        throw new NotFoundException(`Failed to get promoter for link ${body.linkId} for signup creation.`);
      }

      const programResult = linkResult.program;

      const createContactBody: CreateContactDto = {
        programId: linkResult.programId,
        email: body?.email,
        firstName: body?.firstName,
        lastName: body?.lastName,
        phone: body?.phone,
      };

      if (!(this.contactService.verifyReferralKeyInput(programResult.referralKeyType, createContactBody))) {
        throw new BadRequestException(
          `Error. Program ${programResult.programId} referral key "${programResult.referralKeyType}" absent from request.`
        );
      }

      const contactRepository = manager.getRepository(Contact);
      const signUpRepository = manager.getRepository(SignUp);

      const contactExists = await this.contactService.contactExists(programResult.programId, {
        ...(programResult.referralKeyType === referralKeyTypeEnum.EMAIL
          ? { email: body.email }
          : { phone: body.phone })
      });

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
        promoterId: linkResult.promoterId
      });

      const savedSignUp = await signUpRepository.save(newSignUp);

      if (!savedSignUp) {
        this.logger.error(`Error. Failed to create new signup.`);
        throw new InternalServerErrorException(`Error. Failed to create new signup.`);
      }

      const signUpCreatedEvent = new TriggerEvent(
        triggerEnum.SIGNUP,
        savedContact.contactId,
        linkResult.promoterId,
        programResult.programId,
      );
      this.eventEmitter.emit(TRIGGER_EVENT, signUpCreatedEvent);

      const signUpDto = this.signUpConverter.convert(savedSignUp);

      this.logger.info(`END: createSignUp service`);
      return signUpDto;
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
