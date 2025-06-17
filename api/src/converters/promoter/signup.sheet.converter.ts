import { SignUp } from "src/entities";
import { SignupSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { SignUpTableConverter } from "./signup.table.converter";

export interface ISignUpSheetConverterInput {
	signUps: SignUp[];
};

export class SignUpSheetConverter {

	private signUpTableConverter: SignUpTableConverter;

	constructor() {
		this.signUpTableConverter = new SignUpTableConverter();
	}

	/** For getting purchases data for the promoter */
	convertFrom(
		signUpSheet: SignupSheet, 
		{
			signUps
		}: ISignUpSheetConverterInput
	) {
		this.signUpTableConverter.convertFrom(
			signUpSheet.getSignupTable(),
			signUps
		);
	}
}