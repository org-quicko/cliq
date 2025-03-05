import { Expose } from 'class-transformer';
import { IsString, IsEmail, IsDate, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { roleEnum, statusEnum } from 'src/enums';

export class MemberDto {
    @Expose({ name: 'member_id' })
    @IsUUID()
    memberId: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @Expose({ name: 'first_name' })
    @IsString()
    firstName: string;

    @Expose({ name: 'last_name' })
    @IsString()
    lastName: string;

    @IsOptional()
    @IsEnum(roleEnum)
    role?: roleEnum;

    @IsOptional()
    @IsEnum(statusEnum)
    status?: statusEnum;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;

}

export class CreateMemberDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @Expose({ name: 'first_name' })
    @IsString()
    firstName: string;

    @Expose({ name: 'last_name' })
    @IsString()
    lastName: string;
    
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) { }