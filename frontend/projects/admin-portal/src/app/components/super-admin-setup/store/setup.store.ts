import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { UserService } from '../../../services/user.service';
import { EventEmitter, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, pipe } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { CreateUserDto } from '@org.quicko.cliq/ngx-core';
import { instanceToPlain } from 'class-transformer';

type SetupState = {
  superAdmin: CreateUserDto | null;
  error: string | null;
};

const initialState: SetupState = {
  superAdmin: null,
  error: null,
};

export const OnSuccess: EventEmitter<boolean> = new EventEmitter();
export const OnError: EventEmitter<string> = new EventEmitter();

export const SetupStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      userService = inject(UserService),
      snackbarService = inject(SnackbarService)
    ) => ({
      createSuperAdmin: rxMethod<{ body: CreateUserDto }>(
        pipe(
          concatMap(({ body }) => {
            return userService.createSuperAdmin(instanceToPlain(body)).pipe(
              tapResponse({
                next: (response) => {
                  if (response.data) {
                    snackbarService.openSnackBar('Super admin created successfully', '');
                    OnSuccess.emit(true);
                  } else {
                    patchState(store, { error: response.message || 'Unknown error' });
                    snackbarService.openSnackBar(response.message || 'Unknown error', '');
                  }
                },
                error: (error: HttpErrorResponse) => {
                  if (error.status === 409) {
                    snackbarService.openSnackBar('Super admin already exists', '');
                  } else {
                    snackbarService.openSnackBar('Error creating super admin', '');
                  }
                  patchState(store, { error: error.message });
                  OnError.emit(error.message);
                },
              })
            );
          })
        )
      ),
    })
  )
);