import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
	selector: '[dynamicComponent]',
	standalone: true,
})
export class DynamicComponentDirective {
	constructor(public viewContainerRef: ViewContainerRef) {}
}
