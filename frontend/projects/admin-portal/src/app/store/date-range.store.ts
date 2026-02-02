import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

export type DateRangeType = '7' | '30' | '90' | '180' | '365' | 'all' | 'custom';

export interface DateRangeState {
  activeRange: DateRangeType;
  start: Date | null;
  end: Date | null;
}

const initialState: DateRangeState = {
  activeRange: '30',
  start: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  })(),
  end: new Date(),
};

export const DateRangeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ activeRange, start, end }) => ({
    label: computed(() => {
      const type = activeRange();
      if (type === '7') return 'Last 7 days';
      if (type === '30') return 'Last 30 days';
      if (type === '90') return 'Last 3 months';
      if (type === '180') return 'Last 6 months';
      if (type === '365') return 'Last Year';
      if (type === 'all') return 'All time';
      return 'Custom range';
    }),

    formattedRange: computed(() => {
      const s = start();
      const e = end();
      if (!s || !e) return 'All time';
      
      const formatDate = (d: Date) => {
        const day = d.getDate();
        const month = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        
        const suffix = ['th', 'st', 'nd', 'rd'][
          day % 10 > 3 ? 0 : ((day % 100 - day % 10 !== 10) ? 1 : 0) * (day % 10)
        ];
        
        return `${day}${suffix} ${month}, ${year}`;
      };
      
      return `${formatDate(s)} - ${formatDate(e)}`;
    }),
  })),

  withMethods((store) => ({
    applyRange(payload: { type: DateRangeType; start: Date | null; end: Date | null }) {
      patchState(store, {
        activeRange: payload.type,
        start: payload.start,
        end: payload.end,
      });
    },

    reset() {
      patchState(store, initialState);
    },
  }))
);
