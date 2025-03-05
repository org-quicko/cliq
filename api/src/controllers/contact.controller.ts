// import { Controller, Post, Body, Logger } from '@nestjs/common';
// import { ApiTags, ApiResponse } from '@nestjs/swagger';
// import { ContactService } from '../services/contact.service'
// import { CreateContactDto } from '../dtos';

// @ApiTags('Contact')
// @Controller('/contacts')
// export class ContactController {

// constructor(
//   private readonly contactService: ContactService,
//   private logger: Logger
// ) {}


//   /**
//    * Create contact
//    */
//   @ApiResponse({ status: 201, description: 'Created' })
//   @Post()
//   async createContact(@Body() body: CreateContactDto) {
//     this.logger.info('Start createContact controller');
//     const contactResult = await this.contactService.createContact(body);
//     this.logger.info('End createContact controller');
//     return { message: 'Successfully created contact.', result: contactResult };
//   }
// }
