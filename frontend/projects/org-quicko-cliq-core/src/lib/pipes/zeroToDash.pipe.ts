import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'zeroToDash'
})
export class ZeroToDashPipe implements PipeTransform {
	transform(value: number | undefined | null): string | number {
		return (!value || value === 0) ? '-' : value;
	}
}
