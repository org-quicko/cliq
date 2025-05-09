import { IsString } from "class-validator";

export class SwitchCircle {
    @IsString()
    promoterId: string;

    @IsString()
    programId: string;

    @IsString()
    currentCircleId: string;

    @IsString()
    targetCircleId: string;
}