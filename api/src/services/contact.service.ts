import { Injectable, 
  // Logger
 } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../entities';
import { Repository } from 'typeorm';
import { CreateContactDto } from '../dtos';
import { ContactConverter } from '../converters/contact.converter';
import { ProgramService } from './program.service';
import { contactStatusEnum, referralKeyTypeEnum } from '../enums';
import { LoggerService } from './logger.service';

@Injectable()
export class ContactService {

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,

    private programService: ProgramService,

    private contactConverter: ContactConverter,

    private logger: LoggerService,
  ) { }

  /**
   * Create contact
   */
  async createContact(body: CreateContactDto) {
    this.logger.info('Start createContact service');

    const programResult = await this.programService.getProgramEntity(body.programId);

    const newContact = this.contactRepository.create({
      email: body?.email,
      firstName: body?.firstName,
      lastName: body?.lastName,
      phone: body?.phone,
      program: programResult,
      status: body?.status
      // status defaults to LEAD in database
    });

    const savedContact = await this.contactRepository.save(newContact);

    this.logger.info('End createContact service');
    return this.contactConverter.convert(savedContact);
  }

  async contactExists(programId: string, whereOptions: object) {
    return await this.contactRepository.findOne({
      where: {
        program: {
          programId,
        },
        ...whereOptions
      }
    });
  }

  async changeContactStatus(contactId: string, status: contactStatusEnum) {
    await this.contactRepository.update(contactId, { status, updatedAt: () => `NOW()` });
  }

  verifyReferralKeyInput(referralKeyType: referralKeyTypeEnum, body: CreateContactDto) {

    if (
      ((referralKeyType === referralKeyTypeEnum.EMAIL) && !body.email) ||
      ((referralKeyType === referralKeyTypeEnum.PHONE) && !body.phone)
    ) {
      return false;
    }

    return true;
  }
}
