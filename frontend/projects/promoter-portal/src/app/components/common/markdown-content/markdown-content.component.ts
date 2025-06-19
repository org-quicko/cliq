import { Component, Input, inject, OnChanges, SimpleChanges } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { MarkdownService } from '../../../services/markdown.service';

@Component({
	selector: 'app-markdown-content',
	imports: [],
	templateUrl: './markdown-content.component.html',
	styleUrl: './markdown-content.component.css'
})
export class MarkdownContentComponent implements OnChanges {
	@Input() content: string | undefined;
	processedHtml: SafeHtml = '';

	private markdownService = inject(MarkdownService);

	ngOnChanges(changes: SimpleChanges): void {
		if ('content' in changes) {
			console.log(this.content);
			this.processedHtml = this.content ? this.markdownService.renderToHtml(this.content) : '';
			console.log(this.processedHtml);
		}
	}
}
