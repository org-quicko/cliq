import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
	name: 'ordinalDate',
	standalone: true, // Optional for standalone usage
})
export class OrdinalDatePipe extends DatePipe implements PipeTransform {
	override transform(
		value: null | undefined,
		format?: string,
		timezone?: string,
		locale?: string
	): null;

	override transform(
		value: string | number | Date,
		format?: string,
		timezone?: string,
		locale?: string
	): string | null;

	override transform(
		value: string | number | Date | null | undefined,
		format: string = 'd MMM, yyyy',
		timezone?: string,
		locale: string = 'en-US'
	): string | null {
		if (value === null || value === undefined) return null; // Match DatePipe's null behavior

		// Use DatePipe to get the base formatted date
		let formattedDate = super.transform(value, format, timezone, locale);
		if (!formattedDate) return null;

		// Extract the day from the date
		const date = new Date(value);
		const day = date.getDate();
		const ordinalSuffix = this.getOrdinalSuffix(day);

		// Replace the numeric day with its ordinal version
		return formattedDate.replace(/\b\d{1,2}\b/, `${day}${ordinalSuffix}`);
	}

	private getOrdinalSuffix(day: number): string {
		if (day >= 11 && day <= 13) return 'th'; // Special case for 11-13
		switch (day % 10) {
			case 1: return 'st';
			case 2: return 'nd';
			case 3: return 'rd';
			default: return 'th';
		}
	}
}
