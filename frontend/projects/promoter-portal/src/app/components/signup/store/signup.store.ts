import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { MemberService } from '../../../services/member.service';
import { EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { CreatePromoterDto, MemberDto, MemberExistsInProgramDto, PromoterDto, SignUpMemberDto, Status } from '@org.quicko.cliq/ngx-core';
import { tapResponse } from '@ngrx/operators';
import { SnackbarService } from '@org.quicko/ngx-core';
import { PromoterService } from '../../../services/promoter.service';
import { plainToInstance } from 'class-transformer';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { HttpErrorResponse } from '@angular/common/http';

export interface SignUpState {
	status: Status;
	error: any;
}

const initialSignUpState: SignUpState = {
	status: Status.PENDING,
	error: null,
};

export const onCheckMemberExistenceSuccess: EventEmitter<void> = new EventEmitter();

export const onSignUpSuccess: EventEmitter<void> = new EventEmitter();
export const onSignUpError: EventEmitter<string> = new EventEmitter();

export const onCreatePromoterSuccess: EventEmitter<boolean> = new EventEmitter();
export const onCreatePromoterError: EventEmitter<string> = new EventEmitter();

export const SignUpStore = signalStore(
	withState(initialSignUpState),
	withDevtools('signup'),
	withMethods(
		(
			store,
			memberService = inject(MemberService),
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService),
			authService = inject(AuthService),
		) => ({

			checkMemberExistenceInProgram: rxMethod<{ programId: string, memberExistence: MemberExistsInProgramDto }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ programId, memberExistence }) => {
						return memberService.checkMemberExistenceInProgram(programId, memberExistence).pipe(
							tapResponse({
								next(response) {
									const exists = plainToInstance(Boolean, response.data);

									if (exists) {
										throw new Error('Member already exists');
									}

									onCheckMemberExistenceSuccess.emit();
									patchState(store, { status: Status.SUCCESS });
								},
								error(error) {
									console.error(error);
									patchState(store, { status: Status.ERROR, error });

									if (error instanceof HttpErrorResponse) {
										snackBarService.openSnackBar('Something went wrong. Please try again!', 'Ok');
									} else if (error instanceof Error) {
										snackBarService.openSnackBar(error.message, 'Ok');
									}
								},
							})
						)
					})
				)
			),

			signUp: rxMethod<{ programId: string, createdMember: SignUpMemberDto }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ programId, createdMember }) => {
						return memberService.signUp(programId, createdMember).pipe(
							tapResponse({
								next(response) {
									authService.setToken(response.data!.access_token);

									onSignUpSuccess.emit();
									patchState(store, { status: Status.SUCCESS, error: null });
								},
								error(error) {
									console.error(error);
									onSignUpError.emit();
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to sign up', '');
								},
							})
						)
					})
				)
			),

			createPromoter: rxMethod<{ programId: string, createdPromoter: CreatePromoterDto }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ programId, createdPromoter }) => {
						return promoterService.createPromoter(programId, createdPromoter).pipe(
							tapResponse({
								next(response) {
									onCreatePromoterSuccess.emit();
									patchState(store, { status: Status.SUCCESS, error: null });
								},
								error(error) {
									console.error(error);
									onCreatePromoterError.emit();
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to create promoter', '');
								},
							})
						)
					})
				)
			),

			setStatus(status: Status, error: any = null) {
				if (status === Status.ERROR) {
					if (!error) {
						console.error('Must pass error object on an error status state.');
						throw new Error('Must pass error object on an error status state.');
					}

					patchState(store, { status, error });
				}

				patchState(store, { status });
			}

		})),
);

