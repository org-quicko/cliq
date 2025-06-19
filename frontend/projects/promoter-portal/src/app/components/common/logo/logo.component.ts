import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { ProgramStore } from '../../../store/program.store';
import { NgClass } from '@angular/common';

@Component({
	selector: 'app-logo',
	imports: [NgClass],
	templateUrl: './logo.component.html',
	styleUrl: './logo.component.css'
})
export class LogoComponent {
	@Input({ required: false }) imgClass?: string;
	@Input({ required: false }) nameClass?: string;

	readonly programStore = inject(ProgramStore);

	readonly programName = computed(() => this.programStore.program()?.name);
	readonly programLogoUrl = computed(() => this.programStore.program()?.logoUrl);

}
