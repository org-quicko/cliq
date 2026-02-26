import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { ProgramService } from '../../../../../services/program.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap, pipe, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { plainToInstance } from 'class-transformer';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { HttpErrorResponse } from '@angular/common/http';

import {
  ReferralDto,
  PaginatedList,
  referralSortByEnum,
} from '@org.quicko.cliq/ngx-core';

type ReferralState = {
  referrals: ReferralDto[];
  skip?: number | null;
  take?: number | null;
  count: number;
  search: string | undefined;
  sortBy: referralSortByEnum;
  order: 'ASC' | 'DESC';
  isLoading: boolean;
  isSorting: boolean;
  error: string | null;
};

const initialState: ReferralState = {
  referrals: [],
  skip: 0,
  take: 10,
  count: 0,
  search: undefined,
  sortBy: referralSortByEnum.UPDATED_AT,
  order: 'DESC',
  isLoading: false,
  isSorting: false,
  error: null,
};

export const ReferralStore = signalStore(
  { providedIn: 'root' },
  withDevtools('referrals'),
  withState(initialState),
  withMethods((store, programService = inject(ProgramService)) => ({

    fetchReferrals: rxMethod<{
      programId: string;
      skip?: number;
      take?: number;
      search?: string;
      sortOptions?: {
        sortBy: referralSortByEnum;
        sortOrder: 'ASC' | 'DESC';
      };
      isSortOperation?: boolean;
      isSearchOperation?: boolean;
    }>(
      pipe(
        tap(({ isSortOperation, isSearchOperation }) => {
          if (isSortOperation) {
            patchState(store, {
              isSorting: true,
              referrals: [],
            });
          }
          if (isSearchOperation) {
            patchState(store, {
              referrals: [],
            });
          }
          patchState(store, {
            isLoading: true,
            error: null,
          });
        }),

        switchMap(({ programId, skip, take, search, sortOptions }) => {
          return programService
            .getProgramReferrals(
              programId,
              search ?? store.search(),
              sortOptions?.sortBy ?? store.sortBy(),
              sortOptions?.sortOrder ?? store.order(),
              skip,
              take
            )
            .pipe(
              tapResponse({
                next: (response) => {
                  const referralList = plainToInstance(
                    PaginatedList<ReferralDto>,
                    response.data
                  );
                  const referrals =
                    referralList
                      .getItems()
                      ?.map((r) =>
                        plainToInstance(ReferralDto, r)
                      ) || [];

                  patchState(store, {
                    referrals: referrals, 
                    skip: referralList.getSkip(),
                    take: referralList.getTake(),
                    count: referralList.getCount(),
                    isSorting: false,
                    isLoading: false,
                    error: null,
                  });
                },
                error: (error: HttpErrorResponse) => {
                  if (error.status === 404) {
                    patchState(store, {
                      referrals: [],
                      count: 0,
                      isSorting: false,
                      isLoading: false,
                    });
                  } else {
                    patchState(store, {
                      referrals: [],
                      isSorting: false,
                      isLoading: false,
                      error: error.message,
                    });
                  }
                },
              })
            );
        })
      )
    ),

    resetReferrals() {
      patchState(store, {
        referrals: [],
        count: 0,
      });
    },

  }))
);