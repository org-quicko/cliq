import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CommissionService } from 'src/services/commission.service';
import { CommissionConverter } from 'src/converters/commission.converter';
import { Commission } from '../entities/commission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Commission])],
    providers: [CommissionService, CommissionConverter],
    exports: [CommissionService, CommissionConverter]
})
export class CommissionModule { } 
