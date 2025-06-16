import { Pipe, PipeTransform } from '@angular/core';
import { startCase } from 'lodash-es';

@Pipe({ name: 'snakeToCapitalized' })
export class SnakeToCapitalizedPipe implements PipeTransform {
	transform(value: string): string {
		if (!value) return value;
		return startCase(value.replace(/_/g, ' '));
	}
}
