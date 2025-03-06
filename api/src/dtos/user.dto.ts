import { PartialType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsDate, IsOptional, IsEnum } from 'class-validator';
import { roleEnum, statusEnum } from 'src/enums';

export class UserDto {

    @Expose({ name: 'user_id' })
    @IsUUID()
    userId: string;

    @IsString()
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
    programRole?: roleEnum;

    @IsEnum(roleEnum)
    role: roleEnum;

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

export class CreateUserDto {

    @IsString()
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

}

export class UpdateUserDto extends PartialType(UserDto) { }
