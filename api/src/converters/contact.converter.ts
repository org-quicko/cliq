import { Injectable } from "@nestjs/common";
import { ContactDto } from "../dtos";
import { Contact } from "../entities";

@Injectable()
export class ContactConverter {
    
    convert(contact: Contact): ContactDto {
        const contactDto = new ContactDto();

        contactDto.contactId = contact.contactId;
        
        contactDto.firstName = contact.firstName;
        contactDto.lastName = contact.lastName;
        contactDto.email = contact.email;
        contactDto.phone = contact.phone;
        contactDto.status = contact.status;
        contactDto.programId = contact.program.programId;
        
        contactDto.createdAt = contact.createdAt;
        contactDto.updatedAt = contact.updatedAt;

        return contactDto;
    }

}