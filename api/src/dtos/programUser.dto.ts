import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { statusEnum, roleEnum } from '../enums';

export class ProgramUserDto {

    @Expose({ name: 'program_id' })
    @IsUUID()
    programId: string;

    @Expose({ name: 'user_id' })
    @IsUUID()
    userId: string;

    @IsEnum(statusEnum)
    status: statusEnum;

    // defaults to member in database
    @IsOptional()
    @IsEnum(roleEnum)
    role: roleEnum;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @IsDate()
    updatedAt: Date;

}

export class CreateProgramUserDto {

    @IsEnum(statusEnum)
    status: statusEnum;

    // defaults to member in database
    @IsOptional()
    @IsEnum(roleEnum)
    role: roleEnum;
}

export class UpdateProgramUserDto extends PartialType(CreateProgramUserDto) { }
