import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
	Circle,
	CirclePromoter,
	Function,
	Link,
	Member,
	Program,
	ProgramPromoter,
	ProgramUser,
	Promoter,
	PromoterMember,
	User,
} from '../../src/entities';
import {
	commissionTypeEnum,
	effectEnum,
	functionStatusEnum,
	memberRoleEnum,
	referralKeyTypeEnum,
	statusEnum,
	triggerEnum,
	userRoleEnum,
	visibilityEnum,
} from '../../src/enums';

/**
 * Repository-level builders for the rows most tests need. They write directly
 * through TypeORM (entity hooks such as password hashing still run), so
 * arranging state never depends on the endpoints under test.
 */

export const unique = (prefix: string) =>
	`${prefix}-${randomBytes(4).toString('hex')}`;

export const uniqueEmail = (prefix = 'user') => `${unique(prefix)}@test.local`;

/**
 * ProgramSubscriber.afterInsert looks up the platform super admin to add as
 * every new program's ProgramUser, and crashes (non-null assertion) if none
 * exists, so any test that inserts a Program needs one seeded first. Only one
 * may exist, so this reuses it when present.
 */
export async function seedSuperAdmin(
	dataSource: DataSource,
	password = 'password',
): Promise<User> {
	const repo = dataSource.getRepository(User);
	const existing = await repo.findOne({
		where: { role: userRoleEnum.SUPER_ADMIN },
	});
	if (existing) return existing;

	return repo.save(
		repo.create({
			email: uniqueEmail('super-admin'),
			password,
			firstName: 'Super',
			lastName: 'Admin',
			role: userRoleEnum.SUPER_ADMIN,
		}),
	);
}

export async function createUser(
	dataSource: DataSource,
	overrides: Partial<
		Pick<User, 'email' | 'password' | 'firstName' | 'lastName' | 'role'>
	> = {},
): Promise<User> {
	const repo = dataSource.getRepository(User);
	return repo.save(
		repo.create({
			email: overrides.email ?? uniqueEmail('user'),
			password: overrides.password ?? 'password',
			firstName: overrides.firstName ?? 'Test',
			lastName: overrides.lastName ?? 'User',
			role: overrides.role ?? userRoleEnum.REGULAR,
		}),
	);
}

export interface ProgramFixture {
	program: Program;
	defaultCircle: Circle;
}

/**
 * Creates a program the way ProgramService.createProgram does: the program
 * row plus its DEFAULT_CIRCLE. The super admin is attached by
 * ProgramSubscriber.
 */
export async function createProgram(
	dataSource: DataSource,
	overrides: Partial<
		Pick<Program, 'name' | 'visibility' | 'referralKeyType' | 'currency'>
	> = {},
): Promise<ProgramFixture> {
	await seedSuperAdmin(dataSource);

	const programRepo = dataSource.getRepository(Program);
	const program = await programRepo.save(
		programRepo.create({
			name: overrides.name ?? unique('Program'),
			website: 'https://example.com',
			visibility: overrides.visibility ?? visibilityEnum.PUBLIC,
			currency: overrides.currency ?? 'USD',
			referralKeyType:
				overrides.referralKeyType ?? referralKeyTypeEnum.EMAIL,
			timeZone: 'UTC',
		}),
	);

	const circleRepo = dataSource.getRepository(Circle);
	const defaultCircle = await circleRepo.save(
		circleRepo.create({
			name: 'DEFAULT_CIRCLE',
			isDefaultCircle: true,
			program,
		}),
	);

	return { program, defaultCircle };
}

/** Adds (or replaces) a user's program-scoped role. */
export async function addUserToProgram(
	dataSource: DataSource,
	user: User,
	program: Program,
	role: userRoleEnum,
	status: statusEnum = statusEnum.ACTIVE,
): Promise<ProgramUser> {
	const repo = dataSource.getRepository(ProgramUser);
	return repo.save(
		repo.create({
			userId: user.userId,
			programId: program.programId,
			role,
			status,
		}),
	);
}

export async function createMember(
	dataSource: DataSource,
	program: Program,
	overrides: Partial<
		Pick<Member, 'email' | 'password' | 'firstName' | 'lastName'>
	> = {},
): Promise<Member> {
	const repo = dataSource.getRepository(Member);
	return repo.save(
		repo.create({
			email: overrides.email ?? uniqueEmail('member'),
			password: overrides.password ?? 'password',
			firstName: overrides.firstName ?? 'Test',
			lastName: overrides.lastName ?? 'Member',
			program: { programId: program.programId },
		}),
	);
}

export interface PromoterFixture {
	promoter: Promoter;
	member: Member;
}

/**
 * A promoter that has joined `program` (ProgramPromoter with accepted T&Cs),
 * sits in `circle`, and has `member` as its admin, which is the state a
 * promoter reaches after signing up and registering through the portal.
 */
export async function createPromoter(
	dataSource: DataSource,
	program: Program,
	circle: Circle,
	options: {
		member?: Member;
		name?: string;
		memberRole?: memberRoleEnum;
	} = {},
): Promise<PromoterFixture> {
	const member = options.member ?? (await createMember(dataSource, program));

	const promoterRepo = dataSource.getRepository(Promoter);
	const promoter = await promoterRepo.save(
		promoterRepo.create({ name: options.name ?? unique('Promoter') }),
	);

	await dataSource.getRepository(ProgramPromoter).save({
		programId: program.programId,
		promoterId: promoter.promoterId,
		acceptedTermsAndConditions: true,
	});

	await dataSource.getRepository(PromoterMember).save({
		promoterId: promoter.promoterId,
		memberId: member.memberId,
		role: options.memberRole ?? memberRoleEnum.ADMIN,
		status: statusEnum.ACTIVE,
	});

	await dataSource.getRepository(CirclePromoter).save({
		circleId: circle.circleId,
		promoterId: promoter.promoterId,
	});

	return { promoter, member };
}

export async function createLink(
	dataSource: DataSource,
	program: Program,
	promoter: Promoter,
	refVal = unique('ref'),
): Promise<Link> {
	const repo = dataSource.getRepository(Link);
	return repo.save(
		repo.create({
			name: 'Test link',
			refVal,
			programId: program.programId,
			promoterId: promoter.promoterId,
		}),
	);
}

/** An active commission-generating function on `circle`. */
export async function createCommissionFunction(
	dataSource: DataSource,
	program: Program,
	circle: Circle,
	options: {
		trigger: triggerEnum;
		commissionType: commissionTypeEnum;
		commissionValue: number;
		name?: string;
	},
): Promise<Function> {
	const repo = dataSource.getRepository(Function);
	return repo.save(
		repo.create({
			name: options.name ?? unique('Function'),
			trigger: options.trigger,
			effectType: effectEnum.GENERATE_COMMISSION,
			effect: {
				commission: {
					commissionType: options.commissionType,
					commissionValue: options.commissionValue,
				},
			},
			status: functionStatusEnum.ACTIVE,
			circleId: circle.circleId,
			programId: program.programId,
		} as Partial<Function>),
	);
}
