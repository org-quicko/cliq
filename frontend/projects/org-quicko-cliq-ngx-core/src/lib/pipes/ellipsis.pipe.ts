import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ellipsis', standalone: true
})
export class EllipsisPipe implements PipeTransform {
  transform(value: string, limit?: any): string {
    if (!value) return '';
    if (value?.length > (limit ?? 5)) {
      const transformedString = value.substring(0, limit ?? 5) + '..'
      return transformedString;
    } else {
      return value
    }
  }
}