import { Component, inject, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
// import { ProgressBarComponent } from '../../layouts/progress-bar/progress-bar.component';
import { CreateProgramStore } from './store/create-program.store';

@Component({
    selector: 'app-create-program-container',
    imports: [
        RouterOutlet,
        // ProgressBarComponent,
        MatDividerModule,
        MatButtonModule,
    ],
    providers: [CreateProgramStore],
    templateUrl: './create-program-container.component.html',
    styleUrls: ['./create-program-container.component.css'],
})
export class CreateProgramContainerComponent implements OnInit {
    createProgramStore = inject(CreateProgramStore);
    isLoading = this.createProgramStore.isLoading;

    constructor(public router: Router) {}

    ngOnInit(): void {}

    onExit() {
        this.router.navigate(['/admin/programs/summary']);
    }

    onContinue() {
        this.createProgramStore.setOnNext();
    }
}
