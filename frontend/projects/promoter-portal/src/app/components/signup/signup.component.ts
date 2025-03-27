import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SnackbarService } from '../../../../../org-quicko-cliq-core/src/lib/services/snackbar.service';
import { AccountsContainerComponent } from "../../components/accounts-container/accounts-container.component";
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { MemberDto } from '../../../../../org-quicko-cliq-core/src/lib/dtos';
import { onSignUpError, onSignUpSuccess, SignUpStore } from './store/signup.store';

@Component({
	selector: 'app-signup',
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatSnackBarModule,
		MatIconModule,
		CommonModule,
		RouterLinkActive,
		RouterLink,
		AccountsContainerComponent,
	],
	providers: [SignUpStore],
	templateUrl: './signup.component.html',
	styleUrl: './signup.component.scss'
})
export class SignUpComponent {

	signUpForm: FormGroup;

	member: MemberDto;

	readonly signUpStore = inject(SignUpStore);

	constructor(
		private fb: RxFormBuilder,
		private router: Router,
		private snackBarService: SnackbarService,
		private route: ActivatedRoute
	) {
		this.member = new MemberDto();

		this.signUpForm = this.fb.formGroup(this.member);
	}


	ngOnInit() {
		onSignUpSuccess.subscribe(() => {
			this.router.navigate(['../login'], { relativeTo: this.route });
		});

		onSignUpError.subscribe((message) => {
			this.snackBarService.openSnackBar(message, '');
		});
	}

	onSignUp() {
		if (this.signUpForm.valid) {
			// this.signUpStore.signUp(this.member);
			console.log('ok');
		}
	}
}
