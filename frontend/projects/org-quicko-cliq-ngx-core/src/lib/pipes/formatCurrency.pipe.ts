import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
	name: 'formatCurrency'
})
export class FormatCurrencyPipe extends CurrencyPipe implements PipeTransform {

	override transform(
		value: number | string,
		currencyCode?: string,
		display?: 'code' | 'symbol' | 'symbol-narrow' | string | boolean,
		digitsInfo?: string,
		locale?: string
	): string | null;

	override transform(
		value: null | undefined,
		currencyCode?: string,
		display?: 'code' | 'symbol' | 'symbol-narrow' | string | boolean,
		digitsInfo?: string,
		locale?: string
	): null;

	override transform(
		value: number | null | undefined, // this one is the the override that is gonna be used the most
		currencyCode?: string,
		display?: 'code' | 'symbol' | 'symbol-narrow' | string | boolean,
		digitsInfo?: string,
		locale?: string
	): null;


	override transform(
		value: string | number | null | undefined,
		currencyCode?: string,
		display: 'symbol' | 'code' | 'symbol-narrow' | string | boolean = 'symbol',
		digitsInfo?: string,
		locale?: string
	): string | null {
		if (!value) {
			return '-';
		}
		return super.transform(value, currencyCode, display, digitsInfo, locale);
	}
}
