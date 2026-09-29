import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	createMember,
	createProgram,
	createPromoter,
} from '../support/factories';
import { PromoterMemberService } from '../../src/services/promoterMember.service';

/**
 * PromoterMemberService.getPromoterMemberRowEntity looks up a PromoterMember
 * row by its composite key (promoterId, memberId). Only the fully-specified
 * lookup is covered here; callers that pass an undefined memberId (issue 19
 * in issues.md) and the invite flow that should treat a 404 as "no existing
 * link" but doesn't (issue 29) are pre-existing bugs elsewhere and out of
 * scope for this service's own spec.
 */
describe('PromoterMemberService.getPromoterMemberRowEntity', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: PromoterMemberService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(PromoterMemberService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	it('returns the row when the (promoterId, memberId) pair exists', async () => {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter, member } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);

		const row = await service.getPromoterMemberRowEntity(
			promoter.promoterId,
			member.memberId,
		);

		expect(row.promoterId).toBe(promoter.promoterId);
		expect(row.memberId).toBe(member.memberId);
	});

	it("throws NotFoundException when the memberId doesn't belong to that promoter at all", async () => {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);
		// A member with no PromoterMember row at all (never linked to any promoter).
		const unlinkedMember = await createMember(dataSource, program);

		await expect(
			service.getPromoterMemberRowEntity(
				promoter.promoterId,
				unlinkedMember.memberId,
			),
		).rejects.toThrow(NotFoundException);
	});

	it('throws NotFoundException when the memberId belongs to a different promoter', async () => {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter: promoterA } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);
		const { member: memberB } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);

		await expect(
			service.getPromoterMemberRowEntity(
				promoterA.promoterId,
				memberB.memberId,
			),
		).rejects.toThrow(NotFoundException);
	});

	it('loads the requested relation and omits it when not requested', async () => {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter, member } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);

		const withRelation = await service.getPromoterMemberRowEntity(
			promoter.promoterId,
			member.memberId,
			{ member: true },
		);
		expect(withRelation.member).toBeDefined();
		expect(withRelation.member.memberId).toBe(member.memberId);

		const withoutRelation = await service.getPromoterMemberRowEntity(
			promoter.promoterId,
			member.memberId,
		);
		expect(withoutRelation.member).toBeUndefined();
	});
});
