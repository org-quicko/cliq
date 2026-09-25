import { createHmac } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { dateFormatEnum } from '../enums';
import { formatDate } from './formatDate.util';
import { generateSignature } from './generateSignature.util';
import { getStartEndDate } from './getStartEndDate.util';
import { maskInfo } from './maskInfo.util';
import { roundedNumber } from './roundedNum.util';

describe('generateSignature', () => {
	it('is the hex HMAC-SHA256 of the JSON payload', () => {
		const payload = { id: 'evt_1', data: { amount: 10 } };
		const expected = createHmac('sha256', 'secret')
			.update(JSON.stringify(payload))
			.digest('hex');

		expect(generateSignature(payload, 'secret')).toBe(expected);
	});

	it('changes when the secret changes', () => {
		expect(generateSignature({ a: 1 }, 'one')).not.toBe(
			generateSignature({ a: 1 }, 'two'),
		);
	});
});

describe('maskInfo', () => {
	it('masks the local part of an email', () => {
		expect(maskInfo('johndoe@example.com')).toBe('j*****@example.com');
	});

	it('masks the middle of a phone number', () => {
		expect(maskInfo('+1234567890')).toBe('+12****90');
	});

	it('leaves other values untouched', () => {
		expect(maskInfo('hello')).toBe('hello');
		expect(maskInfo('')).toBe('');
	});
});

describe('roundedNumber', () => {
	it('rounds to two decimals by default', () => {
		expect(roundedNumber(1.004)).toBe(1);
		expect(roundedNumber(12.3456)).toBe(12.35);
	});

	it('honours an explicit precision', () => {
		expect(roundedNumber(12.3456, 0)).toBe(12);
		expect(roundedNumber(12.3456, 3)).toBe(12.346);
	});
});

describe('formatDate', () => {
	const date = new Date(2026, 8, 5);

	it.each([
		[dateFormatEnum.DD_MM_YYYY, '05-09-26'],
		[dateFormatEnum.MM_DD_YYYY, '09-05-26'],
	])('formats as %s', (format, expected) => {
		expect(formatDate(date, format)).toBe(expected);
	});

	it('defaults to DD_MM_YYYY', () => {
		expect(formatDate(date)).toBe('05-09-26');
	});
});

describe('getStartEndDate', () => {
	it('defaults to the last month when no range is given', () => {
		const { parsedStartDate, parsedEndDate } = getStartEndDate(
			undefined,
			undefined,
		);

		const days =
			(parsedEndDate.getTime() - parsedStartDate.getTime()) / 86_400_000;
		expect(days).toBeGreaterThanOrEqual(28);
		expect(days).toBeLessThanOrEqual(31);
	});

	it('parses an explicit range', () => {
		const { parsedStartDate, parsedEndDate } = getStartEndDate(
			'2026-01-01',
			'2026-01-31',
		);

		expect(parsedStartDate.toISOString()).toBe('2026-01-01T00:00:00.000Z');
		expect(parsedEndDate.toISOString()).toBe('2026-01-31T00:00:00.000Z');
	});

	it('rejects a start date after the end date', () => {
		expect(() => getStartEndDate('2026-02-01', '2026-01-01')).toThrow(
			BadRequestException,
		);
	});

	it('rejects an unparseable date', () => {
		expect(() => getStartEndDate('not-a-date', '2026-01-01')).toThrow(
			BadRequestException,
		);
	});
});
