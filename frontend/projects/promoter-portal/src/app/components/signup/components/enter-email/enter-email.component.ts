import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { signUpScreens } from '../../signup.component';
import { onCheckMemberExistenceSuccess } from '../../store/signup.store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
	selector: 'app-enter-email',
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatSnackBarModule,
		MatIconModule,
		MatProgressSpinnerModule,
		CommonModule,
		RouterLinkActive,
		RouterLink,
	],
	templateUrl: './enter-email.component.html',
	styleUrl: './enter-email.component.css'
})
export class EnterEmailComponent implements OnInit {
	@Input({ required: true }) signUpForm: FormGroup;
	@Input({ required: true }) isLoading: Signal<boolean>;
	@Input({ required: true }) error: Signal<any>;
	@Input({ required: true }) onClickContinue: Function;

	@Output() currentScreenEvent = new EventEmitter<signUpScreens>();

	ngOnInit(): void {
		onCheckMemberExistenceSuccess.subscribe(() => {
			this.currentScreenEvent.emit(signUpScreens.ENTER_PERSONAL_AND_PROMOTER_DETAILS);
		})
	}
}
