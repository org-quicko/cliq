import { IsString, IsEmail } from 'class-validator';
import { prop, required } from '@rxweb/reactive-form-validators';

/**
 * DTO for user login (admin portal)
 */
export class LoginDto {
	@prop()
	@required({ message: "E-mail ID is required" })
	@IsEmail()
	email: string;

	@prop()
	@required({ message: "Password is required" })
	@IsString()
	password: string;
}
