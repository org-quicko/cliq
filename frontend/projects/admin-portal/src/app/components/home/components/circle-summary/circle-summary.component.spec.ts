import 'reflect-metadata';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AbilityServiceSignal } from '@casl/angular';
import { of, throwError } from 'rxjs';
import { SnackbarService, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities } from '../../../../permissions/ability';
import { ProgramStore } from '../../../../store/program.store';
import { CirclesService } from '../../../../services/circles.service';
import { CircleSummaryStore } from './store/circle-summary.store';
import { CircleFunctionsStore } from './store/circle-functions.store';
import { CirclePromotersStore } from './store/circle.promoters.store';
import { CircleSummaryComponent } from './circle-summary.component';

describe('Circle actions', () => {
    let dialog: jasmine.SpyObj<MatDialog>;
    let service: jasmine.SpyObj<CirclesService>;
    let router: jasmine.SpyObj<Router>;
    function create(role: userRoleEnum) {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        service = jasmine.createSpyObj('CirclesService', ['deleteCircle']);
        router = jasmine.createSpyObj('Router', ['navigate']);
        const ability = defineUserAbilities(role);
        TestBed.configureTestingModule({ providers: [
            { provide: MatDialog, useValue: dialog },
            { provide: CirclesService, useValue: service },
            { provide: Router, useValue: router },
            { provide: ActivatedRoute, useValue: {} },
            { provide: AbilityServiceSignal, useValue: { can: ability.can.bind(ability) } },
            { provide: SnackbarService, useValue: { openSnackBar: jasmine.createSpy('snackbar') } },
            { provide: ProgramStore, useValue: { program: () => null } },
            { provide: CircleSummaryStore, useValue: { circle: () => ({ circleId: 'circle', name: 'Circle' }) } },
            { provide: CircleFunctionsStore, useValue: {} },
            { provide: CirclePromotersStore, useValue: {} },
        ] });
        const component = TestBed.runInInjectionContext(() => new CircleSummaryComponent());
        component.programId = 'program';
        return component;
    }

    it('prevents viewers from opening edit or delete dialogs', () => {
        const component = create(userRoleEnum.VIEWER);
        component.editCircle();
        component.deleteCircle();
        expect(dialog.open).not.toHaveBeenCalled();
        expect(service.deleteCircle).not.toHaveBeenCalled();
    });

    for (const role of [userRoleEnum.ADMIN, userRoleEnum.SUPER_ADMIN, userRoleEnum.EDITOR]) {
        it(`allows ${role} to delete after confirmation, following API permissions`, () => {
            const component = create(role);
            service.deleteCircle.and.returnValue(of({} as any));
            component.deleteCircle();
            expect(service.deleteCircle).not.toHaveBeenCalled();
            (dialog.open.calls.mostRecent().args[1]!.data as { onSubmit: () => void }).onSubmit();
            expect(service.deleteCircle).toHaveBeenCalledWith('program', 'circle');
            expect(router.navigate).toHaveBeenCalled();
        });
    }

    it('keeps the page available when deletion fails', () => {
        const component = create(userRoleEnum.ADMIN);
        service.deleteCircle.and.returnValue(throwError(() => new Error('Failed')));
        component.deleteCircle();
        (dialog.open.calls.mostRecent().args[1]!.data as { onSubmit: () => void }).onSubmit();
        expect(component.deletingCircle).toBeFalse();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
