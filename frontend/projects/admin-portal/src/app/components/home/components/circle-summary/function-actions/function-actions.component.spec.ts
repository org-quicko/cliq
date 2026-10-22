import 'reflect-metadata';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AbilityServiceSignal } from '@casl/angular';
import { of, throwError } from 'rxjs';
import { FunctionDto, SnackbarService, functionStatusEnum, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities } from '../../../../../permissions/ability';
import { CirclesService } from '../../../../../services/circles.service';
import { FunctionActionsComponent } from './function-actions.component';

describe('Function list actions', () => {
    let service: jasmine.SpyObj<CirclesService>;
    let dialog: jasmine.SpyObj<MatDialog>;
    function create(role = userRoleEnum.ADMIN) {
        service = jasmine.createSpyObj('CirclesService', ['updateFunction', 'deleteFunction']);
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        const ability = defineUserAbilities(role);
        TestBed.configureTestingModule({ providers: [
            { provide: CirclesService, useValue: service },
            { provide: MatDialog, useValue: dialog },
            { provide: AbilityServiceSignal, useValue: { can: ability.can.bind(ability) } },
            { provide: SnackbarService, useValue: { openSnackBar: jasmine.createSpy('snackbar') } },
        ] });
        const component = TestBed.runInInjectionContext(() => new FunctionActionsComponent());
        component.programId = 'program';
        component.func = Object.assign(new FunctionDto(), { functionId: 'function', name: 'Commission', status: functionStatusEnum.ACTIVE });
        return component;
    }

    it('patches only status and refreshes the list after success', () => {
        const component = create();
        const changed = spyOn(component.changed, 'emit');
        service.updateFunction.and.returnValue(of({} as any));
        component.toggleStatus();
        expect(service.updateFunction).toHaveBeenCalledWith('program', 'function', { status: 'inactive' });
        expect(changed).toHaveBeenCalledWith(false);
        component.func.status = functionStatusEnum.INACTIVE;
        component.toggleStatus();
        expect(service.updateFunction).toHaveBeenCalledWith('program', 'function', { status: 'active' });
    });

    it('confirms deletion with autofocus disabled before deleting', () => {
        const component = create();
        const changed = spyOn(component.changed, 'emit');
        service.deleteFunction.and.returnValue(of({} as any));
        component.delete();
        expect(service.deleteFunction).not.toHaveBeenCalled();
        const config = dialog.open.calls.mostRecent().args[1]!;
        expect(config.autoFocus).toBeFalse();
        (config.data as { onSubmit: () => void }).onSubmit();
        expect(service.deleteFunction).toHaveBeenCalledWith('program', 'function');
        expect(changed).toHaveBeenCalledWith(true);
    });

    it('keeps the current list when updating fails', () => {
        const component = create();
        const changed = spyOn(component.changed, 'emit');
        service.updateFunction.and.returnValue(throwError(() => new Error('Failed')));
        component.toggleStatus();
        expect(component.pending).toBeFalse();
        expect(changed).not.toHaveBeenCalled();
    });

    it('prevents viewer actions', () => {
        const component = create(userRoleEnum.VIEWER);
        const edit = spyOn(component.editRequested, 'emit');
        component.edit(); component.toggleStatus(); component.delete();
        expect(edit).not.toHaveBeenCalled();
        expect(dialog.open).not.toHaveBeenCalled();
        expect(service.updateFunction).not.toHaveBeenCalled();
    });
});
