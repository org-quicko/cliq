import { ProgramDto } from "../../../../org-quicko-cliq-core/src/lib/dtos/program.dto";
import { Status } from "../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum";

export interface ProgramStoreModel {
	program: ProgramDto | null;
	error: any;
	status: Status;
}

export const initialProgramState: ProgramStoreModel = {
	program: null,
	error: null,
	status: Status.PENDING
};
