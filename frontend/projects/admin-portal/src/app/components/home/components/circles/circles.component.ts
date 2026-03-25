import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CirclesStore } from './store/circles.store';

@Component({
  selector: 'app-circles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './circles.component.html',
  providers: [CirclesStore],
})
export class CirclesComponent implements OnInit {

  searchControl = new FormControl('');

  paginationOptions = signal({
    pageIndex: 0,
    pageSize: 10,
  });

  circlesStore = inject(CirclesStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  circles = this.circlesStore.circles;
  total = this.circlesStore.total;
  isLoading = this.circlesStore.isLoading;
  error = this.circlesStore.error;

  programId!: string;

  ngOnInit(): void {
    this.route.parent?.parent?.params.subscribe((params: Params) => {
      this.programId = params['program_id'];

      this.paginationOptions.set({ pageIndex: 0, pageSize: 10 });
      this.fetchCircles();
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.paginationOptions.set({ pageIndex: 0, pageSize: 10 });
        this.circlesStore.fetchCircles({
          programId: this.programId,
          search: value?.trim() || undefined,
          skip: 0,
          take: 10,
        });
      });
  }

  fetchCircles() {
    this.circlesStore.fetchCircles({
      programId: this.programId,
      search: this.searchControl.value?.trim() || undefined,
      skip: this.paginationOptions().pageIndex * this.paginationOptions().pageSize,
      take: this.paginationOptions().pageSize,
    });
  }

  onPageChange(event: PageEvent) {
    this.paginationOptions.set({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    });
    this.fetchCircles();
  }

  navigateToCircle(circleId: string) {
    this.router.navigate([circleId], { relativeTo: this.route });
  }
}
