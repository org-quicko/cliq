import { IsString } from "class-validator";

export class SwitchCircleDto {
    @IsString()
    promoterId: string;

    @IsString()
    programId: string;

    @IsString()
    currentCircleId: string;

    @IsString()
    targetCircleId: string;
}