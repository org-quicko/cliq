import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralView } from '../entities';
import { ProgramModule } from './program.module';
import { ReferralService } from '../services/referral.service';
import { ReferralController } from '../controllers/referral.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ReferralView]), ProgramModule],
    controllers: [ReferralController],
    providers: [ReferralService]
})
export class ReferralModule { } 
