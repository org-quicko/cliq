import 'dotenv/config';
import { AppDataSource } from './data-source';
import { Program } from '../src/entities/program.entity';
import { Circle } from '../src/entities/circle.entity';
import { Function } from '../src/entities/function.entity';
import { Condition } from '../src/entities/condition.entity';
import { User } from '../src/entities/user.entity';
import { ProgramUser } from '../src/entities/programUser.entity';
import {
	visibilityEnum,
	referralKeyTypeEnum,
	dateFormatEnum,
	triggerEnum,
	effectEnum,
	functionStatusEnum,
	conditionParameterEnum,
	conditionOperatorEnum,
	commissionTypeEnum,
	userRoleEnum,
	statusEnum,
} from '../src/enums';

/**
 * Realistic demo data for local/dev environments: a couple of affiliate
 * programs, each with a default circle plus an upgraded tier, wired up with
 * commission/tier-upgrade functions and the conditions that gate them, owned
 * by a single platform super admin (mirrors what ProgramService.createProgram
 * does for a real program creator, linking them in via ProgramUser).
 *
 * The app only ever allows one platform-wide super admin (`User.role`;
 * UserService.superAdminExists()/isFirstUserSignUp() enforce this at
 * signup), so this script seeds exactly one and reuses it as the owning
 * ProgramUser (role SUPER_ADMIN, scoped to each program) for every program
 * below, instead of inventing a separate "super admin" per program.
 *
 * Idempotent: re-running this script skips any program whose name already
 * exists instead of creating duplicates, reuses the admin user by email if
 * it's already there, and won't create a second platform super admin if a
 * different one already exists.
 */

const platformSuperAdmin = {
	email: 'admin@cliq.com',
	password: 'adminadmin',
	firstName: 'Cliq',
	lastName: 'Admin',
};

interface SeedCondition {
	parameter: conditionParameterEnum;
	operator: conditionOperatorEnum;
	value: string;
}

interface SeedFunction {
	name: string;
	trigger: triggerEnum;
	status?: functionStatusEnum;
	conditions?: SeedCondition[];
	effect:
		| { type: effectEnum.GENERATE_COMMISSION; commissionType: commissionTypeEnum; commissionValue: number }
		| { type: effectEnum.SWITCH_CIRCLE; targetCircleName: string };
}

interface SeedCircle {
	name: string;
	isDefaultCircle: boolean;
	functions: SeedFunction[];
}

interface SeedProgram {
	name: string;
	website: string;
	visibility: visibilityEnum;
	currency: string;
	referralKeyType: referralKeyTypeEnum;
	themeColor: string;
	termsAndConditions: string;
	dateFormat: dateFormatEnum;
	timeZone: string;
	circles: SeedCircle[];
}

const seedPrograms: SeedProgram[] = [
	{
		name: 'Glow & Co Skincare',
		website: 'https://www.glowandco.com',
		visibility: visibilityEnum.PUBLIC,
		currency: 'USD',
		referralKeyType: referralKeyTypeEnum.EMAIL,
		themeColor: '#D46A9F',
		termsAndConditions:
			'Promoters earn commission on completed, non-refunded orders placed through their referral link. Commissions are voided if the order is returned within 30 days.',
		dateFormat: dateFormatEnum.MM_DD_YYYY,
		timeZone: 'America/New_York',
		circles: [
			{
				name: 'DEFAULT_CIRCLE',
				isDefaultCircle: true,
				functions: [
					{
						name: 'Standard Purchase Commission',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.REVENUE,
								operator: conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
								value: '25',
							},
						],
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.PERCENTAGE,
							commissionValue: 12,
						},
					},
					{
						name: 'New Referral Signup Bonus',
						trigger: triggerEnum.SIGNUP,
						status: functionStatusEnum.ACTIVE,
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.FIXED,
							commissionValue: 3,
						},
					},
					{
						name: 'Promote to VIP Partners',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.NUM_OF_PURCHASES,
								operator: conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
								value: '10',
							},
						],
						effect: {
							type: effectEnum.SWITCH_CIRCLE,
							targetCircleName: 'VIP Partners',
						},
					},
					{
						name: 'Holiday 2025 Bundle Bonus',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.INACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.ITEM_ID,
								operator: conditionOperatorEnum.CONTAINS,
								value: 'holiday-bundle',
							},
						],
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.FIXED,
							commissionValue: 5,
						},
					},
				],
			},
			{
				name: 'VIP Partners',
				isDefaultCircle: false,
				functions: [
					{
						name: 'VIP Purchase Commission',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.REVENUE,
								operator: conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
								value: '25',
							},
						],
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.PERCENTAGE,
							commissionValue: 18,
						},
					},
					{
						name: 'VIP Signup Bonus',
						trigger: triggerEnum.SIGNUP,
						status: functionStatusEnum.ACTIVE,
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.FIXED,
							commissionValue: 6,
						},
					},
				],
			},
		],
	},
	{
		name: 'PulseFit',
		website: 'https://www.pulsefit.app',
		visibility: visibilityEnum.PUBLIC,
		currency: 'USD',
		referralKeyType: referralKeyTypeEnum.EMAIL,
		themeColor: '#2F6F4E',
		termsAndConditions:
			'Promoters earn commission on paid subscriptions started through their referral link. Commissions are paid out monthly once a referred member completes their first billing cycle.',
		dateFormat: dateFormatEnum.YYYY_MM_DD,
		timeZone: 'America/Los_Angeles',
		circles: [
			{
				name: 'DEFAULT_CIRCLE',
				isDefaultCircle: true,
				functions: [
					{
						name: 'Monthly Subscription Commission',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.REVENUE,
								operator: conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
								value: '9',
							},
						],
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.PERCENTAGE,
							commissionValue: 20,
						},
					},
					{
						name: 'Annual Plan Bonus',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.ITEM_ID,
								operator: conditionOperatorEnum.EQUALS,
								value: 'annual-premium-plan',
							},
						],
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.FIXED,
							commissionValue: 15,
						},
					},
					{
						name: 'Free Trial Signup Reward',
						trigger: triggerEnum.SIGNUP,
						status: functionStatusEnum.ACTIVE,
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.FIXED,
							commissionValue: 2,
						},
					},
					{
						name: 'Promote to Creator Circle',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.NUM_OF_PURCHASES,
								operator: conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
								value: '20',
							},
						],
						effect: {
							type: effectEnum.SWITCH_CIRCLE,
							targetCircleName: 'Creator Circle',
						},
					},
				],
			},
			{
				name: 'Creator Circle',
				isDefaultCircle: false,
				functions: [
					{
						name: 'Creator Subscription Commission',
						trigger: triggerEnum.PURCHASE,
						status: functionStatusEnum.ACTIVE,
						conditions: [
							{
								parameter: conditionParameterEnum.REVENUE,
								operator: conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
								value: '9',
							},
						],
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.PERCENTAGE,
							commissionValue: 30,
						},
					},
					{
						name: 'Creator Signup Reward',
						trigger: triggerEnum.SIGNUP,
						status: functionStatusEnum.ACTIVE,
						effect: {
							type: effectEnum.GENERATE_COMMISSION,
							commissionType: commissionTypeEnum.FIXED,
							commissionValue: 5,
						},
					},
				],
			},
		],
	},
];

async function resolvePlatformSuperAdmin(dataSource: import('typeorm').DataSource): Promise<User> {
	const userRepository = dataSource.getRepository(User);

	const byEmail = await userRepository.findOne({ where: { email: platformSuperAdmin.email } });
	if (byEmail) {
		console.log(`- Reusing existing platform super admin "${platformSuperAdmin.email}".`);
		return byEmail;
	}

	// Only one platform super admin may ever exist (see UserService.superAdminExists()).
	// If one's already there under a different email, use it instead of creating a
	// second one and violating that invariant.
	const existingSuperAdmin = await userRepository.findOne({ where: { role: userRoleEnum.SUPER_ADMIN } });
	if (existingSuperAdmin) {
		console.log(
			`- A platform super admin already exists ("${existingSuperAdmin.email}"); reusing it instead of creating "${platformSuperAdmin.email}", since only one may exist.`,
		);
		return existingSuperAdmin;
	}

	console.log(`- Creating platform super admin "${platformSuperAdmin.email}"...`);
	// `User.password` is bcrypt-hashed automatically by the entity's @BeforeInsert hook.
	return userRepository.save(
		userRepository.create({
			email: platformSuperAdmin.email,
			password: platformSuperAdmin.password,
			firstName: platformSuperAdmin.firstName,
			lastName: platformSuperAdmin.lastName,
			role: userRoleEnum.SUPER_ADMIN,
		}),
	);
}

async function seedProgram(dataSource: import('typeorm').DataSource, seedProgram: SeedProgram, owner: User) {
	const programRepository = dataSource.getRepository(Program);
	const circleRepository = dataSource.getRepository(Circle);
	const functionRepository = dataSource.getRepository(Function);
	const conditionRepository = dataSource.getRepository(Condition);
	const programUserRepository = dataSource.getRepository(ProgramUser);

	const existing = await programRepository.findOne({ where: { name: seedProgram.name } });
	if (existing) {
		console.log(`- Skipping "${seedProgram.name}": a program with this name already exists.`);
		return;
	}

	console.log(`- Seeding program "${seedProgram.name}"...`);

	const program = await programRepository.save(
		programRepository.create({
			name: seedProgram.name,
			website: seedProgram.website,
			visibility: seedProgram.visibility,
			currency: seedProgram.currency,
			referralKeyType: seedProgram.referralKeyType,
			themeColor: seedProgram.themeColor,
			termsAndConditions: seedProgram.termsAndConditions,
			dateFormat: seedProgram.dateFormat,
			timeZone: seedProgram.timeZone,
		}),
	);

	// Program-scoped role, distinct from the platform-wide `owner.role` - see the note above.
	await programUserRepository.save(
		programUserRepository.create({
			userId: owner.userId,
			programId: program.programId,
			role: userRoleEnum.SUPER_ADMIN,
			status: statusEnum.ACTIVE,
		}),
	);

	// Circles first, so switch_circle effects can reference other circles in the same program by name.
	const circlesByName = new Map<string, Circle>();
	for (const seedCircle of seedProgram.circles) {
		const circle = await circleRepository.save(
			circleRepository.create({
				name: seedCircle.name,
				isDefaultCircle: seedCircle.isDefaultCircle,
				program,
			}),
		);
		circlesByName.set(seedCircle.name, circle);
	}

	for (const seedCircle of seedProgram.circles) {
		const circle = circlesByName.get(seedCircle.name)!;

		for (const seedFunction of seedCircle.functions) {
			const effect =
				seedFunction.effect.type === effectEnum.GENERATE_COMMISSION
					? {
						commission: {
							commissionType: seedFunction.effect.commissionType,
							commissionValue: seedFunction.effect.commissionValue,
						},
					}
					: {
						targetCircleId: circlesByName.get(seedFunction.effect.targetCircleName)!.circleId,
					};

			const func = await functionRepository.save(
				functionRepository.create({
					name: seedFunction.name,
					trigger: seedFunction.trigger,
					effectType: seedFunction.effect.type,
					effect,
					status: seedFunction.status ?? functionStatusEnum.ACTIVE,
					circle,
					program,
				}),
			);

			if (seedFunction.conditions?.length) {
				await conditionRepository.save(
					seedFunction.conditions.map((condition) =>
						conditionRepository.create({
							parameter: condition.parameter,
							operator: condition.operator,
							value: condition.value,
							func,
						}),
					),
				);
			}
		}
	}

	console.log(
		`  done: ${seedProgram.circles.length} circle(s), ${seedProgram.circles.reduce(
			(sum, c) => sum + c.functions.length,
			0,
		)} function(s).`,
	);
}

async function main() {
	await AppDataSource.initialize();

	console.log('Seeding programs, circles, functions and conditions...');

	const admin = await resolvePlatformSuperAdmin(AppDataSource);
	for (const program of seedPrograms) {
		await seedProgram(AppDataSource, program, admin);
	}

	console.log('Done.');
	console.log(`Platform super admin login: ${platformSuperAdmin.email} / ${platformSuperAdmin.password}`);

	await AppDataSource.destroy();
}

main().catch(async (error) => {
	console.error('Seeding failed:', error);
	await AppDataSource.destroy().catch(() => undefined);
	process.exit(1);
});
