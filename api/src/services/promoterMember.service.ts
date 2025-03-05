import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PromoterMember } from "src/entities";
import { EntityNotFoundError, Repository } from "typeorm";
import { LoggerService } from './logger.service';

@Injectable()
export class PromoterMemberService {
    constructor(
        @InjectRepository(PromoterMember)
        private promoterMemberRepository: Repository<PromoterMember>,

        private logger: LoggerService,
    ) {}

    async getPromoterMemberRowEntity(promoterId: string, memberId: string) {

        this.logger.info('START: checkPromoterMember service');
        
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
            throw new EntityNotFoundError(PromoterMember, { promoterId, memberId })
        }
        
        this.logger.info('END: checkPromoterMember service');
        return promoterMember;
    }
}