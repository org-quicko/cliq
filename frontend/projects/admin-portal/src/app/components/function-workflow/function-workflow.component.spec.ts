import 'reflect-metadata';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AbilityServiceSignal } from '@casl/angular';
import { of, throwError } from 'rxjs';
import { SnackbarService, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities } from '../../permissions/ability';
import { ProgramStore } from '../../store/program.store';
import { CirclesService } from '../../services/circles.service';
import { FunctionWorkflowComponent } from './function-workflow.component';

describe('Function workflow', () => {
    let service: jasmine.SpyObj<CirclesService>;
    let router: jasmine.SpyObj<Router>;
    function create(editing = false, role = userRoleEnum.ADMIN) {
        service = jasmine.createSpyObj('CirclesService', ['getFunction', 'getAllCircles', 'createFunction', 'updateFunction']);
        service.getAllCircles.and.returnValue(throwError(() => new Error('Unavailable')));
        service.getFunction.and.returnValue(of({ data: {
            function_id: 'function', circle_id: 'circle', name: 'Commission', trigger: 'purchase', status: 'active',
            effect_type: 'generate_commission', effect: { commission: { commission_type: 'percentage', commission_value: 10 } },
            conditions: [{ condition_id: 'condition', condition: { parameter: 'revenue', operator: 'greater_than', value: 5 } }],
        } } as any));
        router = jasmine.createSpyObj('Router', ['navigate']);
        const ability = defineUserAbilities(role);
        TestBed.configureTestingModule({ providers: [
            { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ circle_id: 'circle', ...(editing ? { function_id: 'function' } : {}) }) } } },
            { provide: Router, useValue: router },
            { provide: CirclesService, useValue: service },
            { provide: AbilityServiceSignal, useValue: { can: ability.can.bind(ability) } },
            { provide: ProgramStore, useValue: { program: () => ({ programId: 'program', currency: 'INR' }) } },
            { provide: SnackbarService, useValue: { openSnackBar: jasmine.createSpy('snackbar') } },
        ] });
        return TestBed.runInInjectionContext(() => new FunctionWorkflowComponent());
    }

    it('uses the same steps for create and edit and loads saved values for editing', () => {
        const component = create(true);
        expect(component.steps).toEqual(['Details', 'Effect', 'Conditions', 'Review']);
        expect(component.form.controls.name.value).toBe('Commission');
        expect(component.form.controls.commissionValue.value).toBe(10);
        expect(component.conditions.at(0).value.id).toBe('condition');
    });

    it('validates each step and preserves values when navigating back', () => {
        const component = create();
        component.next();
        expect(component.step).toBe(0);
        component.form.controls.name.setValue('New');
        component.next();
        expect(component.step).toBe(1);
        component.form.controls.commissionValue.setValue(101);
        component.next();
        expect(component.step).toBe(1);
        component.form.controls.commissionValue.setValue(10);
        component.next();
        component.back();
        expect(component.form.controls.commissionValue.value).toBe(10);
        expect(service.createFunction).not.toHaveBeenCalled();
    });

    it('creates only after review and sends the current circle and commission payload', () => {
        const component = create();
        service.createFunction.and.returnValue(of({} as any));
        component.form.controls.name.setValue(' New ');
        component.next(); component.next(); component.next();
        expect(service.createFunction).not.toHaveBeenCalled();
        component.next();
        expect(service.createFunction).toHaveBeenCalledWith('program', jasmine.objectContaining({
            name: 'New', status: 'active', circle_id: 'circle', effect_type: 'generate_commission',
            effect: { commission: { commission_type: 'percentage', commission_value: 1 } }, conditions: [],
        }));
        expect(router.navigate).toHaveBeenCalled();
    });

    it('updates existing conditions and supports removing every condition', () => {
        const component = create(true);
        service.updateFunction.and.returnValue(throwError(() => new Error('Failed')));
        component.step = 3;
        component.save();
        expect(service.updateFunction.calls.mostRecent().args[2]['conditions']).toEqual([
            { condition_id: 'condition', condition: { parameter: 'revenue', operator: 'greater_than', value: 5 } },
        ]);
        expect(service.updateFunction.calls.mostRecent().args[2]['status']).toBeUndefined();
        component.conditions.clear();
        component.save();
        expect(service.updateFunction.calls.mostRecent().args[2]['conditions']).toEqual([]);
        expect(component.saving).toBeFalse();
        expect(component.step).toBe(3);
        expect(component.error).toBeTruthy();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('serializes a switch circle effect', () => {
        const component = create();
        service.createFunction.and.returnValue(of({} as any));
        component.form.patchValue({ name: 'Switch', effectType: 'switch_circle', targetCircleId: 'a9cf566e-336e-4ad1-917d-e4083cd477c1' });
        component.step = 3;
        component.save();
        expect(service.createFunction).toHaveBeenCalledWith('program', jasmine.objectContaining({
            effect_type: 'switch_circle', effect: { target_circle_id: 'a9cf566e-336e-4ad1-917d-e4083cd477c1' },
        }));
    });

    it('formats conditions as readable rules with currency and quoted item IDs', () => {
        const component = create();
        expect(component.conditionText({ parameter: 'revenue', operator: 'greater_than_or_equal_to', value: 1000 })).toBe('Revenue is at least ₹1,000.00');
        expect(component.conditionText({ parameter: 'item_id', operator: 'contains', value: 'product' })).toBe('Item Id contains “product”');
    });

    it('offers valid comparisons and resets incompatible values when changing parameter', () => {
        const component = create();
        component.addCondition();
        component.conditions.at(0).patchValue({ parameter: 'item_id', operator: 'greater_than', value: 5 });
        component.changeParameter(0);
        expect(component.availableOperators('item_id')).toEqual(['equals', 'contains']);
        expect(component.conditions.at(0).value.operator).toBe('equals');
        expect(component.conditions.at(0).value.value).toBe('');
        expect(component.availableOperators('revenue')).not.toContain('contains');
    });

    it('prevents viewers from creating functions', () => {
        const component = create(false, userRoleEnum.VIEWER);
        component.step = 3;
        component.save();
        expect(service.createFunction).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalled();
    });
});
