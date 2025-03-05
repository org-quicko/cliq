import { PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class SignUpDto {

    @IsUUID()
    contactId: string;

    @Expose({ name: 'link_id' })
    @IsUUID()
    linkId: string;

    @IsOptional()
    @IsString()
    email?: string;

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
    phone?: string;
    
    @Expose({ name: 'promoter_id' })
    @IsUUID()
    promoterId: string;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;
    
    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;

}

export class CreateSignUpDto {

    @Expose({ name: 'link_id' })
    @IsUUID()
    linkId: string;

    @IsOptional()
    @IsString()
    email?: string;

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
    phone?: string;

}

export class UpdateSignUpDto extends PartialType(CreateSignUpDto) { }
