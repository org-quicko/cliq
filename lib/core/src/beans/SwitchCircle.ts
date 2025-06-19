import { IsString } from "class-validator";
import { Expose } from "class-transformer";

export class SwitchCircle {
	@Expose({ name: 'promoter_id' })
	@IsString()
	promoterId?: string;

	@Expose({ name: 'program_id' })
	@IsString()
	programId?: string;

	@Expose({ name: 'current_circle_id' })
	@IsString()
	currentCircleId?: string;

	@Expose({ name: 'target_circle_id' })
	@IsString()
	targetCircleId?: string;

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
	}

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getCurrentCircleId(): string | undefined {
		return this.currentCircleId;
	}

	setCurrentCircleId(value: string | undefined): void {
		this.currentCircleId = value;
	}

	getTargetCircleId(): string | undefined {
		return this.targetCircleId;
	}

	setTargetCircleId(value: string | undefined): void {
		this.targetCircleId = value;
	}
}