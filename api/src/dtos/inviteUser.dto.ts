import { Expose } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { roleEnum } from "../enums";

export class InviteUserDto {

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

    // defaults to "member" in database
    @IsOptional()
    @IsEnum(roleEnum)
    role: roleEnum;
}