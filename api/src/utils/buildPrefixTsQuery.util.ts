export function buildPrefixTsQuery(input: string): string {
	if (!input) return '';

	const normalized = input
		.toLowerCase()
		.replace(/[._\-\/\\+]+/g, ' ')
		.replace(/[&|!:*()'"<>]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!normalized) return '';

	return normalized
		.split(' ')
		.map(t => `${t}:*`)
		.join(' & ');
}
