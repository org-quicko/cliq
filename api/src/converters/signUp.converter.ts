import { Injectable } from "@nestjs/common";
import { SignUpDto } from "../dtos";
import { SignUp } from "../entities";

@Injectable()
export class SignUpConverter {
    
    convert(signUp: SignUp): SignUpDto {
        const signUpDto = new SignUpDto();

        signUpDto.contactId = signUp.contactId;
        
        signUpDto.promoterId = signUp.promoterId;
        signUpDto.linkId = signUp.linkId;
        signUpDto.email = signUp.contact?.email;
        signUpDto.firstName = signUp.contact?.lastName;
        signUpDto.lastName = signUp.contact?.lastName;
        signUpDto.phone = signUp.contact?.phone;

        
        signUpDto.createdAt = signUp.createdAt;
        signUpDto.updatedAt = signUp.updatedAt;

        return signUpDto;
    }

}