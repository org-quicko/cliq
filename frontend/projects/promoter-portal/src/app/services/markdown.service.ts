import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeStringify from 'rehype-stringify';

@Injectable({
	providedIn: 'root',
})
export class MarkdownService {
	constructor(private sanitizer: DomSanitizer) { }

	renderToHtml(markdown: string): SafeHtml {
		const html = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeRaw)
			.use(rehypeHighlight as any, { ignoreMissing: true })
			.use(rehypeExternalLinks, {
				target: '_blank',
				rel: ['noopener', 'noreferrer'],
			})
			.use(rehypeStringify)
			.processSync(markdown)
			.toString();

		return this.sanitizer.bypassSecurityTrustHtml(html);


	}

	copyToClipboard(markdown: string): void {
		const html = this.renderToHtml(markdown);
		const htmlString = this.sanitizer.sanitize(SecurityContext.HTML, html);

		if (htmlString) {
			const blobHtml = new Blob([htmlString], { type: 'text/html' });
			const blobPlain = new Blob([markdown], { type: 'text/plain' });
			const item = new ClipboardItem({
				'text/html': blobHtml,
				'text/plain': blobPlain,
			});

			if (navigator.clipboard && (navigator.clipboard as any).write) {
				(navigator.clipboard as any).write([item]);
			} else {
				navigator.clipboard.writeText(markdown);
			}
		} else {
			throw new Error('Unable to sanitize HTML content for clipboard copying.');
		}
	}
}
