import 'reflect-metadata';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { CirclesService } from '../../../../../services/circles.service';
import { EditCircleFunctionDialogComponent } from './edit-circle-function-dialog.component';

describe('EditCircleFunctionDialogComponent', () => {
    let service: jasmine.SpyObj<CirclesService>;
    let ref: { close: jasmine.Spy; disableClose: boolean };

    function create(data: object) {
        service = jasmine.createSpyObj('CirclesService', ['updateCircle', 'updateFunction', 'getAllCircles']);
        service.getAllCircles.and.returnValue(throwError(() => new Error('Unavailable')));
        ref = { close: jasmine.createSpy('close'), disableClose: false };
        TestBed.configureTestingModule({ providers: [
            { provide: MAT_DIALOG_DATA, useValue: data },
            { provide: MatDialogRef, useValue: ref },
            { provide: CirclesService, useValue: service },
            { provide: SnackbarService, useValue: { openSnackBar: jasmine.createSpy('snackbar') } },
        ] });
        return TestBed.runInInjectionContext(() => new EditCircleFunctionDialogComponent());
    }

    it('saves a trimmed circle name and closes after success', () => {
        const component = create({ programId: 'program', circle: { circleId: 'circle', name: 'Old' } });
        service.updateCircle.and.returnValue(of({} as any));
        component.form.controls.name.setValue(' New ');
        component.save();
        expect(service.updateCircle).toHaveBeenCalledWith('program', 'circle', { name: 'New' });
        expect(ref.close).toHaveBeenCalledWith(true);
    });

    it('rejects blank names', () => {
        const component = create({ programId: 'program', circle: { circleId: 'circle', name: 'Old' } });
        component.form.controls.name.setValue('   ');
        component.save();
        expect(service.updateCircle).not.toHaveBeenCalled();
    });

    it('keeps changes available for retry when saving fails', () => {
        const component = create({ programId: 'program', circle: { circleId: 'circle', name: 'Old' } });
        service.updateCircle.and.returnValue(throwError(() => new Error('Failed')));
        component.form.controls.name.setValue('New');
        component.save();
        expect(ref.close).not.toHaveBeenCalled();
        expect(component.saving).toBeFalse();
        expect(ref.disableClose).toBeFalse();
        expect(component.form.controls.name.value).toBe('New');
        expect(component.error).toBeTruthy();
    });
});
