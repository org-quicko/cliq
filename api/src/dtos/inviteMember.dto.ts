import { Expose } from "class-transformer";
import { IsEmail, IsEnum, IsString } from "class-validator";
import { roleEnum } from "../enums";

export class InviteMemberDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string

    @Expose({ name: 'first_name' })
    @IsString()
    firstName: string;

    @Expose({ name: 'last_name' })
    @IsString()
    lastName: string;

    @IsEnum(roleEnum)
    role: roleEnum;
}