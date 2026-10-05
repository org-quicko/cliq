import { describe, it, expect } from 'vitest';
import { buildPrefixTsQuery } from './buildPrefixTsQuery.util';

describe('buildPrefixTsQuery', () => {
	it('turns each word into an AND-ed prefix match', () => {
		expect(buildPrefixTsQuery('Jane Doe')).toBe('jane:* & doe:*');
	});

	it('splits on separators commonly found in names and emails', () => {
		expect(buildPrefixTsQuery('jane.doe_x-y/z\\w+q')).toBe(
			'jane:* & doe:* & x:* & y:* & z:* & w:* & q:*',
		);
	});

	it('strips characters that are tsquery operators', () => {
		// Left in, these would make to_tsquery throw a syntax error.
		expect(buildPrefixTsQuery(`a&b|c!d:e*f(g)h'i"j<k>l`)).toBe(
			'a:* & b:* & c:* & d:* & e:* & f:* & g:* & h:* & i:* & j:* & k:* & l:*',
		);
	});

	it.each(['', '   ', '&|!'])('returns an empty string for %j', (input) => {
		expect(buildPrefixTsQuery(input)).toBe('');
	});
});
