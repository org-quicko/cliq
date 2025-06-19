import { Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class UtmParams {
    @Expose({ name: 'utm_id' })
    @IsOptional()
    @IsString()
    utmId?: string;

    @Expose({ name: 'utm_source' })
    @IsOptional()
    @IsString()
    utmSource?: string;
    
    @Expose({ name: 'utm_medium' })
    @IsOptional()
    @IsString()
    utmMedium?: string;
    
    @Expose({ name: 'utm_campaign' })
    @IsOptional()
    @IsString()
    utmCampaign?: string;
    
    @Expose({ name: 'utm_term' })
    @IsOptional()
    @IsString()
    utmTerm?: string;
    
    @Expose({ name: 'utm_content' })
    @IsOptional()
    @IsString()
    utmContent?: string;

    getUtmId(): string | undefined {
        return this.utmId;
    }

    setUtmId(value: string | undefined): void {
        this.utmId = value;
    }

    getUtmSource(): string | undefined {
        return this.utmSource;
    }

    setUtmSource(value: string | undefined): void {
        this.utmSource = value;
    }

    getUtmMedium(): string | undefined {
        return this.utmMedium;
    }

    setUtmMedium(value: string | undefined): void {
        this.utmMedium = value;
    }

    getUtmCampaign(): string | undefined {
        return this.utmCampaign;
    }

    setUtmCampaign(value: string | undefined): void {
        this.utmCampaign = value;
    }

    getUtmTerm(): string | undefined {
        return this.utmTerm;
    }

    setUtmTerm(value: string | undefined): void {
        this.utmTerm = value;
    }

    getUtmContent(): string | undefined {
        return this.utmContent;
    }

    setUtmContent(value: string | undefined): void {
        this.utmContent = value;
    }
}