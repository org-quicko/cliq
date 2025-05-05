import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { ProgramStore } from '../../../store/program.store';
import { NgClass } from '@angular/common';

@Component({
	selector: 'app-logo',
	imports: [NgClass],
	templateUrl: './logo.component.html',
	styleUrl: './logo.component.scss'
})
export class LogoComponent implements OnInit {
	@Input({ required: false }) imgClass?: string;
	@Input({ required: false }) nameClass?: string;

	readonly programStore = inject(ProgramStore);

	readonly programName = computed(() => this.programStore.program()?.name);
	readonly programLogoUrl = computed(() => this.programStore.program()?.logoUrl);

	ngOnInit(): void {
		console.log(this.programStore.program());
	}
}
