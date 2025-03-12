import { IsString } from "class-validator";

export class UtmParams {
    @IsString()
    source: string;
    
    @IsString()
    medium: string;
}