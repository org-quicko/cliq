import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { LogInStore, onSignInError, onSignInSuccess } from './store/login.store';
import { AccountsContainerComponent } from "../../components/accounts-container/accounts-container.component";
import { LogoComponent } from '../common/logo/logo.component';
import { LoginDto, SnackbarService } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatSnackBarModule,
		MatIconModule,
		CommonModule,
		AccountsContainerComponent,
		LogoComponent,
	],
	providers: [LogInStore],
	templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

	loginForm: FormGroup;

	hidePassword = true;

	readonly logInStore = inject(LogInStore);

	admin: LoginDto;

	isLoading = signal<boolean>(false);

	constructor(
		private fb: RxFormBuilder,
		private router: Router,
		private snackBarService: SnackbarService
	) {
		this.admin = new LoginDto();
		this.loginForm = this.fb.formGroup(this.admin);
	}

	ngOnInit() {
		onSignInSuccess.subscribe(({ isSuperAdmin }) => {
			if (isSuperAdmin) {
				// Super admin gets redirected to programs summary
				this.router.navigate(['/programs/summary']);
			} else {
				// Regular user gets redirected to programs list
				this.router.navigate(['/programs']);
			}
			this.isLoading.set(false);
		});

		onSignInError.subscribe((message) => {
			this.snackBarService.openSnackBar(message, '');
			this.isLoading.set(false);
		});
	}

	onLogin() {
		if (this.loginForm.valid) {
			this.isLoading.set(true);
			this.logInStore.logIn({
				admin: this.admin
			});
		}
	}
}
