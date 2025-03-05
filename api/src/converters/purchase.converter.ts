import { Injectable } from "@nestjs/common";
import { PurchaseDto } from "../dtos";
import { Purchase } from "../entities";

@Injectable()
export class PurchaseConverter {
    
    convert(purchase: Purchase): PurchaseDto {
        const purchaseDto = new PurchaseDto();

        purchaseDto.purchaseId = purchase.purchaseId;
        
        purchaseDto.linkId = purchase.link.linkId;
        purchaseDto.email = purchase.contact.email;
        purchaseDto.amount = purchase.amount;
        purchaseDto.firstName = purchase.contact.firstName;
        purchaseDto.lastName = purchase.contact.lastName;
        purchaseDto.phone = purchase.contact.phone;
        purchaseDto.externalId = purchase.externalId;
        purchaseDto.contactId = purchase.contact.contactId;

        purchaseDto.createdAt = purchase.createdAt;
        purchaseDto.updatedAt = purchase.updatedAt;

        return purchaseDto;
    }

}