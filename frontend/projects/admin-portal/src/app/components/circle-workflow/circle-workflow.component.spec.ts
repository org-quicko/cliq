import 'reflect-metadata';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AbilityServiceSignal } from '@casl/angular';
import { of, throwError } from 'rxjs';
import { SnackbarService, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities } from '../../permissions/ability';
import { ProgramStore } from '../../store/program.store';
import { CirclesService } from '../../services/circles.service';
import { CircleWorkflowComponent } from './circle-workflow.component';

describe('Circle workflow', () => {
    let service: jasmine.SpyObj<CirclesService>;
    let router: jasmine.SpyObj<Router>;
    function create(role = userRoleEnum.ADMIN) {
        service = jasmine.createSpyObj('CirclesService', ['createCircle']);
        router = jasmine.createSpyObj('Router', ['navigate']);
        const ability = defineUserAbilities(role);
        TestBed.configureTestingModule({ providers: [
            { provide: Router, useValue: router },
            { provide: CirclesService, useValue: service },
            { provide: AbilityServiceSignal, useValue: { can: ability.can.bind(ability) } },
            { provide: ProgramStore, useValue: { program: () => ({ programId: 'program' }) } },
            { provide: SnackbarService, useValue: { openSnackBar: jasmine.createSpy('snackbar') } },
        ] });
        return TestBed.runInInjectionContext(() => new CircleWorkflowComponent());
    }

    it('blocks a blank name', () => {
        const component = create();
        component.form.controls.name.setValue('   ');
        component.save();
        expect(service.createCircle).not.toHaveBeenCalled();
    });

    it('sends the trimmed name and returns to the list', () => {
        const component = create();
        service.createCircle.and.returnValue(of({} as any));
        component.form.controls.name.setValue(' Gold ');
        component.save();
        expect(service.createCircle).toHaveBeenCalledWith('program', { name: 'Gold' });
        expect(router.navigate).toHaveBeenCalled();
    });

    it('stays on the form and shows an error when creation fails', () => {
        const component = create();
        service.createCircle.and.returnValue(throwError(() => new Error('Failed')));
        component.form.controls.name.setValue('Gold');
        component.save();
        expect(component.saving).toBeFalse();
        expect(component.error).toBeTruthy();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('prevents viewers from creating circles', () => {
        const component = create(userRoleEnum.VIEWER);
        component.form.controls.name.setValue('Gold');
        component.save();
        expect(service.createCircle).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalled();
    });
});
