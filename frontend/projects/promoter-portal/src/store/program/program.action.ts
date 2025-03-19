import { createAction, props } from "@ngrx/store";
import { ProgramDto } from "../../../../org-quicko-cliq-core/src/lib/dtos/program.dto";

export const MemberActions = {
	GET_PROGRAM: createAction('[Program] GET program'),

	GET_PROGRAM_SUCCESS: createAction(
		'[Program] GET program SUCCESS',
		props<{ program: ProgramDto }>()
	),

	GET_PROGRAM_FAILURE: createAction(
		'[Program] GET program FAILURE',
		props<{ error: string }>()
	),

};
