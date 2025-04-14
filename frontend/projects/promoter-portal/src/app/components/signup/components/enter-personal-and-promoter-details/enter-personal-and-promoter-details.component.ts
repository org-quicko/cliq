import { Component, computed, EventEmitter, Input, OnInit, Output, Signal } from '@angular/core';
import { signUpScreens } from '../../signup.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { onCreatePromoterSuccess } from '../../store/signup.store';

@Component({
	selector: 'app-enter-personal-and-promoter-details',
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatSnackBarModule,
		MatIconModule,
		CommonModule,
	],
	templateUrl: './enter-personal-and-promoter-details.component.html',
	styleUrl: './enter-personal-and-promoter-details.component.scss'
})
export class EnterPersonalAndPromoterDetailsComponent implements OnInit {
	@Input({ required: true }) signUpForm: FormGroup;
	@Input({ required: true }) error: Signal<any>;
	@Input({ required: true }) setStatus: Function;
	@Input({ required: true }) onClickContinue: Function;

	@Output() currentScreenEvent = new EventEmitter<signUpScreens>();

	hidePassword: boolean = true;

	constructor(private router: Router, private route: ActivatedRoute) {
		onCreatePromoterSuccess.subscribe(() => {
			this.router.navigate(['../tnc'], { relativeTo: this.route });
		});
	}

	ngOnInit(): void { }

	onClickBack() {
		this.currentScreenEvent.emit(signUpScreens.ENTER_EMAIL);
	}

}
