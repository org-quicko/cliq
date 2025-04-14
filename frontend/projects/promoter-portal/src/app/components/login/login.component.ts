import { Component, computed, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { LogInStore, onSignInError, onSignInSuccess } from './store/login.store';
import { MemberDto } from '../../../../../org-quicko-cliq-core/src/lib/dtos';
import { AccountsContainerComponent } from "../../components/accounts-container/accounts-container.component";
import { TempLogoComponent } from "../temp-logo/temp-logo.component";
import { ProgramStore } from '../../store/program.store';
import { SnackbarService } from '@org.quicko/ngx-core';

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
		RouterLinkActive,
		RouterLink,
		AccountsContainerComponent,
		TempLogoComponent
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

	member: MemberDto;

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
		});

		onSignInError.subscribe((message) => {
			this.snackBarService.openSnackBar(message, '');
		});
	}

	onLogin() {
		if (this.loginForm.valid) {
			this.logInStore.logIn({
				member: this.member,
				programId: this.programId()
			});
		}
	}
}
