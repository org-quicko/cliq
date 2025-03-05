import { PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsUUID, Min, IsDate } from 'class-validator';

export class PurchaseDto {

    @Expose({ name: 'purchase_id' })
    @IsUUID()
    purchaseId: string;

    @Expose({ name: 'link_id' })
    @IsUUID()
    linkId: string;

    @IsNumber()
    // @IsPositive({ message: 'amount entered must be greater than 0' })
    @Min(0, { message: 'amount entered must be non negative.' })
    amount: number;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @Expose({ name: 'first_name' })
    @IsString()
    firstName: string;

    @IsOptional()
    @Expose({ name: 'last_name' })
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @Expose({ name: 'external_id' })
    @IsString()
    externalId: string;

    @Expose({ name: 'contact_id' })
    @IsUUID()
    contactId: string;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;

}

export class CreatePurchaseDto {

    @Expose({ name: 'link_id' })
    @IsUUID()
    linkId: string;

    @IsNumber()
    // @IsPositive({ message: 'amount entered must be greater than 0' })
    @Min(0, { message: 'amount entered must be non negative.' })
    amount: number;

    @IsOptional()
    @Expose({ name: 'first_name' })
    @IsString()
    firstName?: string;

    @IsOptional()
    @Expose({ name: 'last_name' })
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @Expose({ name: 'external_id' })
    @IsString()
    externalId: string;

    @IsOptional()
    @IsString()
    phone?: string;

}

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) { }
