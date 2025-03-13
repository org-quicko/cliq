import { Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class UtmParams {
    @Expose({ name: 'utm_id' })
    @IsOptional()
    @IsString()
    utmId: string;

    @Expose({ name: 'utm_source' })
    @IsOptional()
    @IsString()
    utmSource: string;
    
    @Expose({ name: 'utm_medium' })
    @IsOptional()
    @IsString()
    utmMedium: string;
    
    @Expose({ name: 'utm_campaign' })
    @IsOptional()
    @IsString()
    utmCampaign: string;
    
    @Expose({ name: 'utm_term' })
    @IsOptional()
    @IsString()
    utmTerm: string;
    
    @Expose({ name: 'utm_content' })
    @IsOptional()
    @IsString()
    utmContent: string;
}