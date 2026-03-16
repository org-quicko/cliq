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

	renderToHtml(content: string): SafeHtml {
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
			.processSync(content)
			.toString();

		return this.sanitizer.bypassSecurityTrustHtml(html);
	}
}
