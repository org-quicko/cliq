import { Injectable } from "@nestjs/common";
import { ProgramUserDto } from "../dtos";
import { ProgramUser } from "../entities";

@Injectable()
export class ProgramUserConverter {
    
    convert(programUser: ProgramUser): ProgramUserDto {
        const programUserDto = new ProgramUserDto();

        programUserDto.programId = programUser.programId;

        programUserDto.userId = programUser.userId;
        programUserDto.status = programUser.status;
        programUserDto.role = programUser.role;

        programUserDto.createdAt = programUser.createdAt;
        programUserDto.updatedAt = programUser.updatedAt;

        return programUserDto;
    }

}