import { Component, Input } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-stroked-btn',
	imports: [
		MatButtonModule,
		MatIconModule,
	],
	templateUrl: './stroked-btn.component.html',
	styleUrl: './stroked-btn.component.scss'
})
export class StrokedBtnComponent {
	@Input({ required: true }) onClick: Function;
	@Input({ required: true }) icon: string;
	@Input({ required: true }) text: string;
	@Input({ required: true }) minWidth: string;
	@Input() btnType: 'submit' | 'button' = 'button';
}
