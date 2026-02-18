import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';
import { DateRangeStore, DateRangeType } from '../../../store/date-range.store';
import { signal } from '@angular/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

export const MY_FORMATS = {
  parse: { dateInput: 'Do MMM, YYYY' },
  display: {
    dateInput: 'Do MMM, YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'Do MMM, YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatNativeDateModule,
    MatIconModule,
    PortalModule
],
  templateUrl: './date-range-filter.component.html',
  styleUrls: ['./date-range-filter.component.css'],
  providers: [
    provideMomentDateAdapter(MY_FORMATS),
  ]
})
export class DateRangeFilterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private overlay = inject(Overlay);
  private dateRangeStore = inject(DateRangeStore);

  @ViewChild(CdkPortal) portal!: CdkPortal;
  @ViewChild('triggerBtn', { read: ElementRef }) triggerBtn!: ElementRef;

  @Output() rangeApplied = new EventEmitter<void>();

  tempActiveRange = signal<DateRangeType>(this.dateRangeStore.activeRange());

  overlayRef?: OverlayRef;

  dateForm = this.fb.group({
    start: this.fb.control<Date | null>(null),
    end: this.fb.control<Date | null>(null),
  });

  sidebarRanges: { label: string; value: DateRangeType }[] = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 3 months', value: '90' },
    { label: 'Last 6 months', value: '180' },
    { label: 'Last Year', value: '365' },
    { label: 'All time', value: 'all' },
    { label: 'Custom', value: 'custom' },
  ];


  activeRange = this.dateRangeStore.activeRange;
  label = this.dateRangeStore.label;
  selectedDateRangeText = this.dateRangeStore.formattedRange;


  tempRangeType: DateRangeType = this.dateRangeStore.activeRange();
  tempStart: Date | null = this.dateRangeStore.start();
  tempEnd: Date | null = this.dateRangeStore.end();

  ngOnInit() {
    this.dateForm.patchValue({
      start: this.tempStart,
      end: this.tempEnd,
    });
  }

  togglePopup() {
    if (this.overlayRef?.hasAttached()) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  openPopup() {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerBtn.nativeElement)
      .withPositions([
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.attach(this.portal);
    this.overlayRef.backdropClick().subscribe(() => this.closePopup());
  }

  closePopup() {
    this.overlayRef?.detach();
  }

  selectRange(type: DateRangeType) {
    this.tempActiveRange.set(type);

    if (type === 'custom') return;

    const today = new Date();

    if (type === 'all') {
      this.dateForm.patchValue({ start: null, end: null });
      return;
    }

    const daysBackMap: Record<'7' | '30' | '90' | '180' | '365', number> = {
      '7': 6,
      '30': 29,
      '90': 89,
      '180': 179,
      '365': 364,
    };

    const daysBack = daysBackMap[type];
    const start = new Date(today);
    start.setDate(today.getDate() - daysBack);

    this.dateForm.patchValue({ start, end: today });
  }

  onDateChange() {
    const { start, end } = this.dateForm.value;
    this.tempRangeType = 'custom';
    this.tempStart = start ?? null;
    this.tempEnd = end ?? null;
  }

  apply() {
    const { start, end } = this.dateForm.value;

    this.dateRangeStore.applyRange({
      type: this.tempActiveRange(),
      start: start ?? null,
      end: end ?? null,
    });

    this.closePopup();
    this.rangeApplied.emit();
  }

  ngOnDestroy() {
    this.overlayRef?.dispose();
  }
}
