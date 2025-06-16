import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEnum, IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { ContactStatus } from '../enums';

export class Referral {
	@Expose({ name: 'contact_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	contactId?: string;

	@Expose({ name: 'program_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	programId?: string;

	@Expose({ name: 'promoter_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	promoterId?: string;

	@Expose({ name: 'contact_info' })
	@IsString()
	contactInfo?: string;

	@Expose({ name: 'total_revenue' })
	@IsNumber()
	@Min(0)
	totalRevenue?: number;

	@Expose({ name: 'total_commission' })
	@IsNumber()
	@Min(0)
	totalCommission?: number;

	@Expose()
	@IsEnum(ContactStatus)
	status?: ContactStatus;

	@Expose({ name: 'updated_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	updatedAt?: Date;

	getContactId(): string | undefined {
		return this.contactId;
	}

	setContactId(value: string | undefined): void {
		this.contactId = value;
	}

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
	}

	getContactInfo(): string | undefined {
		return this.contactInfo;
	}

	setContactInfo(value: string | undefined): void {
		this.contactInfo = value;
	}

	getTotalRevenue(): number | undefined {
		return this.totalRevenue;
	}

	setTotalRevenue(value: number | undefined): void {
		this.totalRevenue = value;
	}

	getTotalCommission(): number | undefined {
		return this.totalCommission;
	}

	setTotalCommission(value: number | undefined): void {
		this.totalCommission = value;
	}

	getStatus(): ContactStatus | undefined {
		return this.status;
	}

	setStatus(value: ContactStatus | undefined): void {
		this.status = value;
	}

	getUpdatedAt(): Date | undefined {
		return this.updatedAt;
	}

	setUpdatedAt(value: Date | undefined): void {
		this.updatedAt = value;
	}
}