import { SignUp } from "../../entities";
import { SignupSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { SignUpTableConverter } from "./signup.table.converter";
import { ConverterException } from '@org-quicko/core';

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
		{
			signUps
		}: ISignUpSheetConverterInput
	) {
		try {
			const signUpSheet = new SignupSheet();

			const signUpTable = this.signUpTableConverter.convertFrom(signUps);
			signUpSheet.replaceBlock(signUpTable);

			return signUpSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Signup Sheet', error);
		}
	}
}