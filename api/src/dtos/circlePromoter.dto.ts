import { IsArray, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CirclePromoterDto {

    @Expose({ name: 'promoter_ids' })
    @IsArray()
    @IsUUID(undefined, { each: true })
    promoterIds: string[];

}

export class CreateCirclePromoterDto {

    @Expose({ name: 'promoter_ids' })
    @IsArray()
    @IsUUID(undefined, { each: true })
    promoterIds: string[];

}

export class UpdateCirclePromoterDto extends PartialType(CreateCirclePromoterDto) { }
