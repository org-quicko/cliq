import { roleEnum } from "src/enums";

export interface AuthInput {
    email: string;
    password: string;
};

export interface AuthResult {
    accessToken: string;
};

export interface LoginData {
    email: string;
    role?: roleEnum;
};