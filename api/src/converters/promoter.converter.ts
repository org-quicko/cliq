import { Injectable } from "@nestjs/common";
import { PromoterDto } from "../dtos";
import { Promoter } from "../entities";

@Injectable()
export class PromoterConverter {
    public convert(promoter: Promoter): PromoterDto {
        const promoterDto = new PromoterDto();

        promoterDto.promoterId = promoter.promoterId;

        promoterDto.name = promoter.name;
        promoterDto.logoUrl = promoter.logoUrl;
        
        promoterDto.createdAt = promoter.createdAt;
        promoterDto.updatedAt = promoter.updatedAt;
        
        return promoterDto;
    }
}