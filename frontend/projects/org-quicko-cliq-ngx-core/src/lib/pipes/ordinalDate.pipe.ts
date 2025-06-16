import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
	name: 'ordinalDate',
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
		format: string = 'd MMM yyyy',
		timezone?: string,
		locale: string = 'en-US',
		showTime: boolean = true,
		timeFormat: string = 'h:mm a',
	): string | null {
		if (value === null || value === undefined) return null; // Match DatePipe's null behavior

		// Use DatePipe to get the base formatted date
		let formattedDate = super.transform(value, format, timezone, locale);
		if (!formattedDate) return null;

		// Extract the day from the date
		const date = new Date(value);
		const day = date.getDate();
		const ordinalSuffix = this.getOrdinalSuffix(day);

		formattedDate = formattedDate.replace(/\b\d{1,2}\b/, `${day}${ordinalSuffix}`)

		// If showTime is true, append the time in "h:mm a" format
		if (showTime) {
			const time = super.transform(value, timeFormat, timezone, locale); // Use DatePipe to format time
			if (time) {
				formattedDate = `${time}, ${formattedDate}`;
			}
		}

		// Replace the numeric day with its ordinal version
		return formattedDate;
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
