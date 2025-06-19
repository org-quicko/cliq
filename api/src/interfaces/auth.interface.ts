export interface AuthInput {
	email: string;
	password: string;
}

export interface AuthResult {
	access_token: string;
}

export interface LoginData {
	email: string;
}
