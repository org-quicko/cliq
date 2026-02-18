
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-actionable-list-item',
	imports: [
    MatCardModule,
    MatRippleModule,
    MatIconModule,
    MatDivider
],
	templateUrl: './actionable-list-item.component.html',
	styleUrl: './actionable-list-item.component.css'
})
export class ActionableListItemComponent {
	@Input({ required: true }) title: string;
	@Input({ required: true }) description: string;
	@Input({ required: true }) icon: string;
	@Input({ required: true }) onClick: Function;
	@Input({ required: false }) class?: string;
	@Input() hideDivider: boolean = false;
}
