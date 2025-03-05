import { IsArray, IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
export class CircleDto {

    @Expose({ name: 'circle_id' })
    @IsUUID()
    circleId: string;

    @IsString()
    name: string;

    @IsBoolean()
    isDefaultCircle: boolean;

    @Expose({name: 'created_at'})
    @IsDate()
    createdAt: Date;

    @Expose({name: 'updated_at'})
    @IsDate()
    updatedAt: Date;
}

export class CreateCircleDto {

    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    isDefaultCircle?: boolean;

}

export class UpdateCircleDto extends PartialType(CreateCircleDto) {}

export class AddPromoterToCircleDto {
    @IsArray()
    promoters: string[];
}