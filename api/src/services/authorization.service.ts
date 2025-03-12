import { BadRequestException, Injectable } from '@nestjs/common';
import {
    createMongoAbility as createAbility,
    AbilityBuilder,
    CreateAbility,
    MongoAbility as Ability,
    InferSubjects,
    ExtractSubjectType,
} from '@casl/ability';
import {
    ApiKey,
    Circle,
    Commission,
    Condition,
    Contact,
    Function,
    Link,
    Member,
    Program,
    ProgramPromoter,
    ProgramUser,
    Promoter,
    PromoterMember,
    Purchase,
    ReferralView,
    ReferralAggregateView,
    SignUp,
    User,
} from '../entities';
import { roleEnum } from '../enums';
import { UserService } from './user.service';
import { ProgramService } from './program.service';
import { LinkService } from './link.service';
import { PromoterService } from './promoter.service';
import { PromoterMemberService } from './promoterMember.service';
import { MemberService } from './member.service';
import { CircleService } from './circle.service';
import { FunctionService } from './function.service';
import { ProgramPromoterService } from './programPromoter.service';
import { LoggerService } from './logger.service';
import { ApiKeyService } from './apiKey.service';
import { CommissionService } from './commission.service';
import { SignUpService } from './signUp.service';
import { PurchaseService } from './purchase.service';
import { ReferralService } from './referral.service';

// manage is a keyword in CASL that means the admin can do anything
export const actions = [
    'manage',
    'create',
    'read',
    'read_all',
    'update',
    'delete',
    'invite_user',
    'invite_member',
    'remove_user',
    'remove_member',
    'include_promoter',
    'remove_promoter',
    'change_role',
    'operate_in',
] as const;

export type actionsType = (typeof actions)[number];
export type subjectsType =
    | InferSubjects<
        | typeof ApiKey
        | typeof Circle
        | typeof Commission
        | typeof Contact
        | typeof Function
        | typeof Condition
        | typeof Link
        | typeof Member
        | typeof Program
        | typeof ProgramUser
        | typeof Promoter
        | typeof PromoterMember
        | typeof ProgramPromoter
        | typeof Purchase
        | typeof ReferralView
        | typeof ReferralAggregateView
        | typeof SignUp
        | typeof User
    >
    | 'all';

export type AppAbility = Ability<[actionsType, subjectsType]>;
export const createAppAbility = createAbility as CreateAbility<AppAbility>;

const userResources = [
    Program,
    ProgramUser,
    ProgramPromoter,
    Function,
    Condition,
    Circle,
];

@Injectable()
export class AuthorizationService {
    constructor(
        private apiKeySerivce: ApiKeyService,
        private commissionService: CommissionService,
        private signUpService: SignUpService,
        private purchaseService: PurchaseService,
        private userService: UserService,
        private memberService: MemberService,
        private programService: ProgramService,
        private promoterService: PromoterService,
        private linkService: LinkService,
        private circleService: CircleService,
        private functionService: FunctionService,
        private programPromoterService: ProgramPromoterService,
        private promoterMemberService: PromoterMemberService,
        private referralService: ReferralService,

        private logger: LoggerService,
    ) { }

    getProgramUserPermissions(user: User) {
        const programUserPermissions = {};

        user.programUsers.forEach((programUser) => {
            programUserPermissions[programUser.programId] = programUser.role;
        });

        return programUserPermissions;
    }

    getPromoterMemberPermissions(member: Member) {
        const promoterMemberPermissions = {};
        member.promoterMembers.forEach((promoterMember) => {
            promoterMemberPermissions[promoterMember.promoterId] =
                promoterMember.role;
        });

        return promoterMemberPermissions;
    }

    async getSubjects(
        request: any,
        requiredPermissions: { action: actionsType; subject: subjectsType }[],
    ) {
        let subjectObjects: subjectsType[] = [];
        this.logger.info(`START: getSubjects service`);
        subjectObjects = await Promise.all(
            requiredPermissions.map(({ action, subject }) => {
                const subjectUserId = request.params.user_id as string;
                const subjectProgramId = request.params.program_id as string;
                const subjectMemberId = request.params.member_id as string;
                const subjectPromoterId = request.params.promoter_id as string;

                if (subject === User) {
                    if (action === 'read' || action === 'create')
                        return subject;

                    if (!subjectUserId) {
                        throw new BadRequestException(
                            `Error. Must provide a ${typeof subject} for performing action on object`,
                        );
                    }

                    const user = this.userService.getUserEntity(subjectUserId);
                    return user;
                } else if (subject === Program) {
                    if (action === 'read_all' || action === 'create') return subject;

                    if (!subjectProgramId) {
                        throw new BadRequestException(
                            `Error. Must provide a ${typeof subject} ID for performing action on object`,
                        );
                    }

                    return this.programService.getProgramEntity(
                        subjectProgramId,
                    );
                } else if (subject === ProgramUser) {
                    if (action === 'read' || action === 'create')
                        return subject;

                    if (!subjectProgramId || !subjectUserId) {
                        throw new BadRequestException(
                            `Error. Must provide Program ID and User ID for performing action on object`,
                        );
                    }

                    return this.programService.getProgramUserRowEntity(
                        subjectProgramId,
                        subjectUserId,
                    );
                } else if (subject === Member) {

                    if (!subjectMemberId) {
                        throw new BadRequestException(
                            `Error. Must provide a ${subject} ID for performing action on object`,
                        );
                    }

                    return this.memberService.getMemberEntity(subjectMemberId);
                } else if (subject === ProgramPromoter) {
                    if (!subjectProgramId) {
                        throw new BadRequestException(
                            `Error. Must provide a ${typeof subject} ID for performing action on object`,
                        );
                    }

                    return this.programPromoterService.getFirstProgramPromoter(
                        subjectProgramId,
                    );
                } else if (subject === Promoter) {
                    if (!subjectPromoterId) {
                        throw new BadRequestException(
                            `Error. Must provide a ${typeof subject} ID for performing action on object`,
                        );
                    }

                    // const promoter = new Promoter();
                    // promoter.promoterId = subjectPromoterId;
                    // return promoter;
                    return this.promoterService.getPromoterEntity(
                        subjectPromoterId,
                    );
                } else if (subject === PromoterMember) {

                    if (action === 'read_all') {

                        if (!(subjectProgramId && subjectPromoterId)) {
                            throw new BadRequestException(
                                `Error. Must provide a Program ID and Promoter ID for performing action on object`,
                            );
                        }

                        return this.promoterMemberService.getFirstPromoterMemberRow(subjectProgramId, subjectPromoterId);
                    }

                    if (!subjectPromoterId || !subjectMemberId) {
                        throw new BadRequestException(
                            `Error. Must provide Promoter ID and Member ID for performing action on object`,
                        );
                    }

                    return this.promoterMemberService.getPromoterMemberRowEntity(
                        subjectPromoterId,
                        subjectMemberId,
                    );
                } else if (subject === Link) {
                    if (!(subjectProgramId && subjectPromoterId)) {
                        throw new BadRequestException(
                            `Error. Must provide one of Program ID and Promoter ID for performing action on object.`,
                        );
                    }

                    const link = this.linkService.getFirstLink(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                    return link;
                } else if (subject === Circle) {
                    if (!subjectProgramId) {
                        throw new BadRequestException(
                            `Error. Must provide one of Program ID for performing action on object.`,
                        );
                    }

                    return this.circleService.getFirstCircleOfProgram(
                        subjectProgramId,
                    );
                } else if (subject === Function) {
                    if (!subjectProgramId) {
                        throw new BadRequestException(
                            `Error. Must provide Program ID for performing action on object.`,
                        );
                    }

                    return this.functionService.getFirstFunctionOfProgram(
                        subjectProgramId,
                    );
                } else if (subject === ApiKey) {
                    if (action === 'create') return subject;

                    if (!subjectProgramId) {
                        throw new BadRequestException(
                            `Error. Must provide Program ID for performing action on object.`,
                        );
                    }

                    return this.apiKeySerivce.getFirstKey(subjectProgramId);
                } else if (subject === ReferralView) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(
                            `Error. Must provide a Program ID or a Promoter ID for performing action on object`,
                        );
                    }

                    return this.referralService.getFirstReferral(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === ReferralAggregateView) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(
                            `Error. Must provide a Program ID or a Promoter ID for performing action on object`,
                        );
                    }

                    return this.referralService.getFirstReferralAggregate(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === Commission) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(
                            `Error. Must provide a Program ID or a Promoter ID for performing action on object`,
                        );
                    }

                    return this.commissionService.getFirstCommission(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === SignUp) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(
                            `Error. Must provide a Program ID or a Promoter ID for performing action on object`,
                        );
                    }

                    return this.signUpService.getFirstSignUp(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === Purchase) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(
                            `Error. Must provide a Program ID or a Promoter ID for performing action on object`,
                        );
                    }

                    return this.purchaseService.getFirstPurchase(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else {
                    return subject;
                }
            }),
        );

        this.logger.info(`END: getSubjects service`);
        return subjectObjects;
    }

    getUserAbility(user: User) {
        this.logger.info(`START: getUserAbility service`);

        const programUserPermissions = this.getProgramUserPermissions(user);

        const { can: allow, build } = new AbilityBuilder<AppAbility>(
            createAbility,
        );

        // can manage all if user is super admin (except for the things listed below)
        if (user.role === roleEnum.SUPER_ADMIN) {
            allow('manage', userResources);
            allow('read', Promoter);
        }

        for (const [programId, role] of Object.entries(
            programUserPermissions,
        )) {
            allow(
                'read',
                [
                    ReferralView,
                    ReferralAggregateView,
                    ProgramPromoter,
                    Link,
                    Circle,
                    Program,
                    Function,
                    ApiKey,
                ],
                { programId },
            );

            if (role === roleEnum.ADMIN || role === roleEnum.SUPER_ADMIN) {
                // can update program or invite other users to the program
                allow(['update', 'invite_user'], Program, { programId });

                // can change other users' role and change other users' permissions from the program, if that user ain't the super admin
                allow(['change_role', 'remove_user'], ProgramUser, {
                    programId,
                    role: { $ne: roleEnum.SUPER_ADMIN },
                });

                allow('invite_user', ProgramUser, { programId });

                // can also perform all operations on circle, functions and links
                allow('manage', [Link, Circle, Function], { programId });

                allow('manage', [ApiKey], { programId });
            } else if (role === roleEnum.EDITOR) {
                allow('manage', [Link, Circle, Function], { programId });
            }
        }

        allow(['update', 'delete'], User, { userId: user.userId });

        allow('read', User);

        allow('read', Purchase);
        allow('read', SignUp);
        allow('read', Commission);

        const ability = build({
            detectSubjectType: (item) =>
                item.constructor as ExtractSubjectType<subjectsType>,
        });

        this.logger.info(`END: getUserAbility service`);
        return ability;
    }

    getMemberAbility(member: Member) {
        this.logger.info(`START: getMemberAbility service`);

        const promoterMemberPermissions = this.getPromoterMemberPermissions(member);

        const { can: allow, build } = new AbilityBuilder<AppAbility>(createAppAbility);

        for (const [promoterId, role] of Object.entries(promoterMemberPermissions)) {
            allow('read', Promoter, { promoterId });
            allow('read', ReferralView, { promoterId });
            allow('read', ReferralAggregateView, { promoterId });
            allow('read', Commission, { promoterId });
            allow('read_all', PromoterMember, { promoterId });
            allow('read', Member, { promoterMembers: { promoterId } });
            allow('read', ReferralView, { promoterId });
            allow('read', Purchase, { promoterId });
            allow('read', SignUp, { promoterId });
            allow('read', Link, { promoterId });

            if (role === roleEnum.ADMIN) {
                // allow update program or invite other users to the program
                allow(['update', 'invite_member'], Promoter, { promoterId });

                // allow remove other members and change other members' permissions from the program, if that user ain't the super admin
                allow(['remove_member', 'change_role'], PromoterMember, {
                    promoterId,
                    role: roleEnum.VIEWER,
                });

                allow('manage', Link, { promoterId });
            }
        }

        allow(['read', 'update', 'delete'], Member, { memberId: member.memberId });

        const ability = build({
            detectSubjectType: (item) =>
                item.constructor as ExtractSubjectType<subjectsType>,
        });

        this.logger.info(`END: getMemberAbility service`);
        return ability;
    }
}
