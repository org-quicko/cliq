import { Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';
import { CreateProgramStore, OnCreateProgramSuccess } from '../store/create-program.store';
import { CurrencyList } from '../../../utils/currency-list.util';
import { visibilityEnum, referralKeyTypeEnum } from '@org.quicko.cliq/ngx-core';
import * as moment from 'moment-timezone';

@Component({
    selector: 'app-create-program',
    standalone: true,
    imports: [
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule
    ],
    templateUrl: './create-program.component.html',
    styleUrls: ['./create-program.component.css'],
})
export class CreateProgramComponent implements OnInit {

    currencyList = CurrencyList;


    timezoneList: { code: string; text: string }[] = [];

    visibilityOptions = [
        { value: visibilityEnum.PUBLIC, label: 'Public' },
        { value: visibilityEnum.PRIVATE, label: 'Private' },
    ];

    referralKeyTypeOptions = [
        { value: referralKeyTypeEnum.EMAIL, label: 'Email' },
        { value: referralKeyTypeEnum.PHONE, label: 'Phone' },
    ];

    createProgramForm: FormGroup;

    createProgramStore = inject(CreateProgramStore);
    isNextClicked = this.createProgramStore.onNext;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router
    ) {
        this.createProgramForm = this.formBuilder.group({
            name: ['', Validators.required],
            website: ['', Validators.required],
            visibility: [visibilityEnum.PUBLIC, Validators.required],
            referralKeyType: [referralKeyTypeEnum.EMAIL, Validators.required],
            currency: ['INR', Validators.required],
            timeZone: ['Asia/Kolkata', Validators.required],
        });

      
        effect(() => {
            if (this.isNextClicked()) {

                this.createProgramStore.setOnNext();
                this.createProgramForm.markAllAsTouched();

                if (this.createProgramForm.invalid) {
                    return;
                }

                const formValue = this.createProgramForm.value;

                const body = {
                    name: formValue.name,
                    website: formValue.website,
                    visibility: formValue.visibility,
                    referral_key_type: formValue.referralKeyType,
                    currency: formValue.currency,
                    time_zone: formValue.timeZone,
                    terms_and_conditions: '',
                };

                this.createProgramStore.createProgram({ body });
            }
        });
    }

    ngOnInit() {

        this.timezoneList = moment.tz.names()
            .map((tz) => {
                const offsetMinutes = moment.tz(tz).utcOffset();
                const offset = moment.tz(tz).format('Z');

                return {
                    code: tz,
                    text: `${tz} (UTC${offset})`,
                    offsetMinutes
                };
            })
            .sort((a: any, b: any) => a.offsetMinutes - b.offsetMinutes)
            .map(({ code, text }) => ({ code, text })); 

 
        OnCreateProgramSuccess.subscribe((success) => {
            if (success) {
                this.router.navigate(['/programs/summary']);
            }
        });
    }
}
