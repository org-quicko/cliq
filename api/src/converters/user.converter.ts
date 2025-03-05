import { Injectable } from "@nestjs/common";
import { UserDto } from "../dtos";
import { ProgramUser, User } from "../entities";

@Injectable()
export class UserConverter {
    
    convert(user: User, programUser?: ProgramUser): UserDto {
        const userDto = new UserDto();

        userDto.userId = user.userId;

        userDto.email = user.email;
        //  not sending the password
        userDto.firstName = user.firstName;
        userDto.lastName = user.lastName;
        userDto.role = programUser?.role;
        userDto.status = programUser?.status;
        userDto.isSuperAdmin = user.isSuperAdmin;
        
        userDto.createdAt = user.createdAt;
        userDto.updatedAt = user.updatedAt;
        
        return userDto;
    }

}