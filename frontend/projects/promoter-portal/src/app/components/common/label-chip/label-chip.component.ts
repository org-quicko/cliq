import { TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-label-chip',
	imports: [
		TitleCasePipe
	],
	templateUrl: './label-chip.component.html',
	styleUrl: './label-chip.component.scss'
})
export class LabelChipComponent {
	@Input({ required: true }) text: string;
	@Input() textAndBgColorStyle?: string;

	defaultTextAndBgColor: string = 'bg-surface-container text-on-surface';
}
