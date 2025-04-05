import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
	selector: 'app-home',
	imports: [RouterOutlet],
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss',
	standalone: true,
})
export class HomeComponent { }
