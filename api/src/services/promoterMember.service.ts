import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PromoterMember } from "src/entities";
import { Repository } from "typeorm";
import { LoggerService } from './logger.service';

@Injectable()
export class PromoterMemberService {
    constructor(
        @InjectRepository(PromoterMember)
        private promoterMemberRepository: Repository<PromoterMember>,

        private logger: LoggerService,
    ) {}

    async getPromoterMemberRowEntity(promoterId: string, memberId: string) {

        this.logger.info('START: getPromoterMemberRowEntity service');
        
        const promoterMember = await this.promoterMemberRepository.findOne({
            where: {
                promoterId,
                memberId
            }, 
            select: {
                promoterId: true,
                memberId: true,
                role: true,
                status: true
            }
        })
        
        if(!promoterMember){
            this.logger.error(`Error. Failed to find promoterMember for Promoter ID ${promoterId} and Member ID ${memberId}.`);
            throw new NotFoundException(`Error. Failed to find promoterMember for Promoter ID ${promoterId} and Member ID ${memberId}.`);
        }
        
        this.logger.info('END: getPromoterMemberRowEntity service');
        return promoterMember;
    }
}