import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { LogInStore, onSignInError, onSignInSuccess } from './store/login.store';
import { AccountsContainerComponent } from "../../components/accounts-container/accounts-container.component";
import { ProgramStore } from '../../store/program.store';
import { LogoComponent } from '../common/logo/logo.component';
import { MemberDto, SnackbarService } from '@org.quicko.cliq/ngx-core';

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
    RouterLinkActive,
    RouterLink,
    AccountsContainerComponent,
    LogoComponent
],
	providers: [LogInStore],
	templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

	loginForm: FormGroup;

	hidePassword = true;

	readonly logInStore = inject(LogInStore);
	readonly programStore = inject(ProgramStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly programName = computed(() => this.programStore.program()!.name);

	member: MemberDto;

	isLoading = signal<boolean>(false);

	constructor(
		private fb: RxFormBuilder,
		private router: Router,
		private snackBarService: SnackbarService,
		private route: ActivatedRoute
	) {
		this.member = new MemberDto();
		this.loginForm = this.fb.formGroup(this.member);
	}

	ngOnInit() {
		onSignInSuccess.subscribe(() => {
			this.router.navigate(['../home/dashboard'], { relativeTo: this.route });
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
				member: this.member,
				programId: this.programId()
			});
		}
	}
}
