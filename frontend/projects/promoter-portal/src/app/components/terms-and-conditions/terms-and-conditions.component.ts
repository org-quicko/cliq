import { Component, computed, inject, OnInit } from '@angular/core';
import { AccountsContainerComponent } from '../accounts-container/accounts-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProgramStore } from '../../store/program.store';
import { PromoterStore } from '../../store/promoter.store';
import { onRegisterForProgramSuccess, TncStore } from './store/tnc.store';
import { ActivatedRoute, Router } from '@angular/router';
import { RegisterForProgramDto, Status } from '@org.quicko.cliq/ngx-core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MarkdownContentComponent } from '../common/markdown-content/markdown-content.component';

@Component({
	selector: 'app-terms-and-conditions',
	imports: [
		AccountsContainerComponent,
		MatButtonModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MarkdownContentComponent
	],
	providers: [TncStore],
	templateUrl: './terms-and-conditions.component.html',
	styleUrl: './terms-and-conditions.component.css'
})
export class TermsAndConditionsComponent implements OnInit {

	programStore = inject(ProgramStore);
	promoterStore = inject(PromoterStore);
	tncStore = inject(TncStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);
	readonly isLoading = computed(() => this.tncStore.status() === Status.LOADING);

	readonly programTnc = computed(() => this.programStore.program()!.termsAndConditions);

	constructor(
		private router: Router,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		onRegisterForProgramSuccess.subscribe(() => {
			this.promoterStore.updatePromoterTncAcceptedStatus(true);
			this.router.navigate(['../home'], { relativeTo: this.route });
		});
	}

	onSubmit() {
		const registerForProgram = new RegisterForProgramDto();
		registerForProgram.acceptedTermsAndConditions = true;

		this.tncStore.registerForProgram({
			programId: this.programId(),
			promoterId: this.promoterId(),
			registerForProgram
		});
	}

	onCancel() {
		this.router.navigate(['../login'], { relativeTo: this.route });
	}

}
