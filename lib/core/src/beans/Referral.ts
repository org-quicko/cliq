import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEnum, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { ContactStatus } from '../enums';

export class Referral {
    @Expose({ name: 'contact_id' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsUUID()
    contactId: string;

    @Expose({ name: 'program_id' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsUUID()
    programId: string;

    @Expose({ name: 'promoter_id' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsUUID()
    promoterId: string;
    
    @Expose({ name: 'contact_info' })
    @IsString()
    contactInfo: string;

    @Expose({ name: 'total_revenue'})
    @IsNumber()
    @Min(0)
    totalRevenue: number;

    @Expose({ name: 'total_commission'})
    @IsNumber()
    @Min(0)
    totalCommission: number;

    @IsEnum(ContactStatus)
    status: ContactStatus;

    @Expose({ name: 'updated_at' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsDate()
    updatedAt: Date;
}