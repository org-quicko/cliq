import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountsContainerComponent } from "../../components/accounts-container/accounts-container.component";
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { onSignUpError, onSignUpSuccess, SignUpStore } from './store/signup.store';
import { TempLogoComponent } from '../temp-logo/temp-logo.component';
import { CreatePromoterDto, MemberExistsInProgramDto, SignUpMemberDto, Status } from '@org.quicko.cliq/ngx-core';
import { SnackbarService } from '@org.quicko/ngx-core';
import { ProgramStore } from '../../store/program.store';
import { EnterPersonalAndPromoterDetailsComponent } from './components/enter-personal-and-promoter-details/enter-personal-and-promoter-details.component';
import { EnterEmailComponent } from './components/enter-email/enter-email.component';

export enum signUpScreens {
	ENTER_EMAIL = 'enter-email',
	ENTER_PERSONAL_AND_PROMOTER_DETAILS = 'enter-personal-and-promoter-details'
};

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
		AccountsContainerComponent,
		EnterEmailComponent,
		EnterPersonalAndPromoterDetailsComponent,
		TempLogoComponent,
	],
	providers: [SignUpStore],
	templateUrl: './signup.component.html',
	styleUrl: './signup.component.scss'
})
export class SignUpComponent {

	signUpForm: FormGroup;

	member: SignUpMemberDto;

	hidePassword: boolean = true;

	readonly signUpStore = inject(SignUpStore);
	readonly programStore = inject(ProgramStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly programName = computed(() => this.programStore.program()!.name);
	readonly isLoading = computed(() => this.signUpStore.status() === Status.LOADING);
	readonly error = computed(() => this.signUpStore.error());

	currentScreen: signUpScreens = signUpScreens.ENTER_EMAIL;

	constructor(
		private fb: RxFormBuilder,
		private router: Router,
		private snackBarService: SnackbarService,
		private route: ActivatedRoute
	) {
		this.member = new SignUpMemberDto();
		this.signUpForm = this.fb.formGroup<SignUpMemberDto>(this.member);
		this.signUpForm.addControl('promoterName', new FormControl());
	}


	ngOnInit() {
		onSignUpSuccess.subscribe(() => {
			const createdPromoter = new CreatePromoterDto();
			createdPromoter.name = this.signUpForm.get('promoterName')?.value;

			this.signUpStore.createPromoter({
				programId: this.programId(),
				createdPromoter
			});
		});

		onSignUpError.subscribe((message) => {
			this.snackBarService.openSnackBar(message, '');
		});
	}

	changeScreen(value: signUpScreens) {
		this.currentScreen = value;
	}

	onClickContinueOnFirstScreen = () => {
		if (this.signUpForm.valid) {

			const memberExists = new MemberExistsInProgramDto();
			memberExists.email = this.signUpForm.get('email')?.value;

			this.signUpStore.checkMemberExistenceInProgram({
				memberExistence: memberExists,
				programId: this.programId(),
			});
		}
	}

	onClickContinueOnSecondScreen = () => {
		if (this.signUpForm.valid) {

			this.signUpStore.signUp({
				createdMember: this.member,
				programId: this.programId(),
			});
			// this.router.navigate(['../tnc'], { relativeTo: this.route });
		}
	}
}
