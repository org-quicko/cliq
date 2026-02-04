import { Expose } from 'class-transformer';
import { IsString, IsNumber, IsDate } from 'class-validator';

export class ProgramSummaryMvDto {
    @Expose({ name: 'program_id' })
    @IsString()
    programId: string;

    @Expose({ name: 'program_name' })
    @IsString()
    programName: string;

    @Expose({ name: 'total_promoters' })
    @IsNumber()
    totalPromoters: number;

    @Expose({ name: 'total_referrals' })
    @IsNumber()
    totalReferrals: number;

    @Expose({ name: 'created_at' })
    @IsDate()
    createdAt: Date;
}
