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
    PromoterAnalyticsView,
    SignUp,
    User,
    Webhook,
    LinkAnalyticsView,
} from '../entities';
import { memberRoleEnum, userRoleEnum, statusEnum } from '../enums';
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
import { WebhookService } from './webhook.service';
import { PromoterAnalyticsService } from './promoterAnalytics.service';
import { actionsType, subjectsType } from 'src/types';

// these types are in order to check nested properties
type FlatPurchase = Purchase & {
    'contact.programId': Purchase['contact']['programId']
};

type FlatSignUp = SignUp & {
    'contact.programId': SignUp['contact']['programId']
};

type FlatCommission = Commission & {
    'contact.programId': Commission['contact']['programId']
};

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
        private PromoterAnalyticsService: PromoterAnalyticsService,
        private webhookService: WebhookService,

        private logger: LoggerService,
    ) { }

    getProgramUserPermissions(user: User) {
        const programUserPermissions = {};

        user.programUsers.forEach((programUser) => {
            if (programUser.status === statusEnum.ACTIVE) {
                programUserPermissions[programUser.programId] = programUser.role;
            }
        });

        return programUserPermissions;
    }

    getPromoterMemberPermissions(member: Member) {
        const promoterMemberPermissions = {};
        member.promoterMembers.forEach((promoterMember) => {

            if (promoterMember.status === statusEnum.ACTIVE) {
                promoterMemberPermissions[promoterMember.promoterId] = promoterMember.role;
            }
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
                    if (action === 'create')
                        return subject;

                    if (!subjectUserId) {
                        throw new BadRequestException(`Error. Must provide a ${subject} for performing action on object`);
                    }

                    const user = this.userService.getUserEntity(subjectUserId);
                    return user;
                } else if (subject === Program) {
                    if (action === 'read_all' || action === 'create') return subject;

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide a ${subject} ID for performing action on object`);
                    }

                    return this.programService.getProgramEntity(
                        subjectProgramId,
                    );
                } else if (subject === ProgramUser) {
                    if (action === 'read' || action === 'create')
                        return subject;

                    if (!subjectProgramId || !subjectUserId) {
                        throw new BadRequestException(`Error. Must provide Program ID and User ID for performing action on object`);
                    }

                    return this.programService.getProgramUserRowEntity(
                        subjectProgramId,
                        subjectUserId,
                    );
                } else if (subject === Member) {

                    if (!subjectMemberId) {
                        throw new BadRequestException(`Error. Must provide a ${subject} ID for performing action on object`);
                    }

                    return this.memberService.getMemberEntity(subjectMemberId);
                } else if (subject === ProgramPromoter) {
                    if (action === 'read_all') {
                        if (!subjectProgramId) {
                            throw new BadRequestException(`Error. Must provide a Program ID for performing action on object`);
                        }
                        
                        // in case user can read even on row, this means they can read all rows
                        return this.programPromoterService.getFirstProgramPromoter(
                            subjectProgramId,
                        );
                    }
                    
                    if (!subjectProgramId || !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide Program ID and Promoter ID for performing action on object`);
                    }

                    // since user wants specific row, get the row from the database
                    return this.programPromoterService.getProgramPromoter(subjectProgramId, subjectPromoterId);

                } else if (subject === Promoter) {
                    if (action === 'create' || action === 'read_all') return subject;

                    if (!subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a ${subject} ID for performing action on object`);
                    }

                    return this.promoterService.getPromoterEntity(
                        subjectPromoterId,
                    );
                } else if (subject === PromoterMember) {

                    if (action === 'read_all') {

                        if (!(subjectProgramId && subjectPromoterId)) {
                            throw new BadRequestException(`Error. Must provide a Program ID and Promoter ID for performing action on object`);
                        }

                        return this.promoterMemberService.getFirstPromoterMemberRow(subjectProgramId, subjectPromoterId);
                    }

                    if (!subjectPromoterId || !subjectMemberId) {
                        throw new BadRequestException(`Error. Must provide Promoter ID and Member ID for performing action on object`);
                    }

                    return this.promoterMemberService.getPromoterMemberRowEntity(
                        subjectPromoterId,
                        subjectMemberId,
                    );
                } else if (subject === Link) {
                    if (!(subjectProgramId && subjectPromoterId)) {
                        throw new BadRequestException(`Error. Must provide one of Program ID and Promoter ID for performing action on object.`);
                    }

                    if (action === 'create') return subject;

                    const link = this.linkService.getFirstLink(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                    return link;
                } else if (subject === Circle) {
                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide one of Program ID for performing action on object.`);
                    }

                    return this.circleService.getFirstCircleOfProgram(
                        subjectProgramId,
                    );
                } else if (subject === Function) {
                    if (action === 'create' || action === 'read_all') return subject;

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide Program ID for performing action on object.`);
                    }

                    return this.functionService.getFirstFunctionOfProgram(
                        subjectProgramId,
                    );
                } else if (subject === ApiKey) {
                    if (action === 'create') return subject;

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide Program ID for performing action on object.`);
                    }

                    return this.apiKeySerivce.getFirstKey(subjectProgramId);
                } else if (subject === ReferralView) {
                    if (action === 'read_all') return subject;

                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a Program ID or a Promoter ID for performing action on object`);
                    }

                    return this.referralService.getFirstReferral(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === PromoterAnalyticsView) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a Program ID or a Promoter ID for performing action on object`);
                    }

                    return this.PromoterAnalyticsService.getFirstPromoterStat(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === Commission) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a Program ID or a Promoter ID for performing action on object`);
                    }

                    return this.commissionService.getFirstCommission(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === SignUp) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a Program ID or a Promoter ID for performing action on object`);
                    }

                    return this.signUpService.getFirstSignUp(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === Purchase) {
                    if (!subjectProgramId && !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a Program ID or a Promoter ID for performing action on object`);
                    }

                    return this.purchaseService.getFirstPurchase(
                        subjectProgramId,
                        subjectPromoterId,
                    );
                } else if (subject === Webhook) {
                    if (action === 'create') return subject;

                    const subjectProgramId = request.headers.program_id as string;

                    if (!subjectProgramId) {
                        this.logger.error(`Error. Must provide Program ID for performing action on object.`);
                        throw new BadRequestException(`Error. Must provide Program ID for performing action on object.`);
                    }

                    return this.webhookService.getFirstWebhook(subjectProgramId);
                }
                else {
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

        const { can: allow, build } = new AbilityBuilder<AppAbility>(createAbility);

        // can manage all if user is super admin (except for the things listed below)
        if (user.role === userRoleEnum.SUPER_ADMIN) {
            allow('manage', userResources);
            allow('manage', Promoter);
        }

        for (const [programId, role] of Object.entries(programUserPermissions)) {
            allow(['read', 'read_all'], [ReferralView, PromoterAnalyticsView, ProgramPromoter, Link, Circle, Program, Function], { programId });
            allow('read', User, { programUsers: { $elemMatch: { programId } } });

            allow<FlatPurchase>('read', Purchase, { 'contact.programId': programId });
            allow<FlatSignUp>('read', SignUp, { 'contact.programId': programId });
            allow<FlatCommission>('read', Commission, { 'contact.programId': programId });

            if (role === userRoleEnum.ADMIN || role === userRoleEnum.SUPER_ADMIN) {

                // can update program or invite other users to the program
                allow(['update', 'invite_user'], Program, { programId });

                allow('manage', Promoter);

                // can only manage the program-promoter relations if you are admin of a program with this program ID
                allow('manage', ProgramPromoter, { programId });

                // can change other users' role and change other users' permissions from the program, if that user ain't the super admin
                allow(['change_role', 'remove_user'], ProgramUser, { programId, role: { $ne: userRoleEnum.SUPER_ADMIN } });

                allow('invite_user', ProgramUser, { programId });

                // can also perform all operations on circle, functions and links
                allow('manage', [Link, Circle, Function, ApiKey, Webhook], { programId });

            } else if (role === userRoleEnum.EDITOR) {
                allow('manage', [Link, Circle, Function], { programId });
            }

        }

        allow(['update', 'delete'], User, { userId: user.userId });
        allow('leave', Program);

        const ability = build({
            detectSubjectType: (item) =>
                item.constructor as ExtractSubjectType<subjectsType>,
        });

        this.logger.info(`END: getUserAbility service`);
        return ability;
    }

    getApiUserAbility(programId: string) {
        this.logger.info(`START: getApiUserAbility service`);

        const abilityBuilder = new AbilityBuilder<AppAbility>(createAbility);
        const { can: allow, build } = abilityBuilder;

        allow('manage', [Member]);
        allow<User>('create', Promoter, { programUsers: { $elemMatch: { programId } } });

        allow(['update', 'delete', 'include_promoter', 'update'], Promoter, { programPromoters: { $elemMatch: { programId } } }); // can manage a promoter of that program
        // can only manage the program-promoter relations if you are admin of a program with this program ID
        allow('manage', ProgramPromoter, { programId });
        allow(['change_role', 'remove_user'], ProgramUser, { programId, role: { $ne: userRoleEnum.SUPER_ADMIN } });
        allow('manage', ApiKey, { programId });
        allow(['update', 'invite_user'], Program, { programId });
        allow('manage', [ApiKey, Webhook], { programId });
        allow('read', Program, { programId });
        allow<FlatPurchase>('read', Purchase, { 'contact.programId': programId });
        allow<FlatSignUp>('read', SignUp, { 'contact.programId': programId });
        allow<FlatCommission>('read', Commission, { 'contact.programId': programId });

        const ability = build({
            detectSubjectType: (item) => item.constructor as ExtractSubjectType<subjectsType>,
        });

        this.logger.info(`END: getApiUserAbility service`);
        return ability;
    }


    getMemberAbility(member: Member) {
        this.logger.info(`START: getMemberAbility service`);

        const promoterMemberPermissions = this.getPromoterMemberPermissions(member);

        const { can: allow, build } = new AbilityBuilder<AppAbility>(createAppAbility);

        for (const [promoterId, role] of Object.entries(promoterMemberPermissions)) {

            allow(['read', 'leave'], Promoter, { promoterId });
            allow(['read', 'read_all'], [PromoterAnalyticsView, Commission, PromoterMember, ReferralView, Purchase, SignUp, Link], { promoterId });
            allow(['read', 'read_all'], LinkAnalyticsView);

            allow('read', Member, { promoterMembers: { $elemMatch: { promoterId } } });

            if (role === memberRoleEnum.EDITOR) {
                allow('manage', Link, { promoterId });
                allow('update', Promoter);

            } else if (role === memberRoleEnum.ADMIN) {
                // allow update program or invite other users to the program
                // also, can only register on behalf of the promoter if member is the admin of that promoter
                allow('manage', [Promoter, PromoterMember, Link], { promoterId });

                // can only manage the program-promoter relatoins if you are admin of this promoter
                allow('manage', ProgramPromoter, { promoterId });
            }
        }

        allow(['update', 'delete'], Member, { memberId: member.memberId });

        // of course any member can create a promoter- IF they aren't part of any other promoter -> and that check exists in the createPromoter service
        allow('create', Promoter);

        const ability = build({
            detectSubjectType: (item) =>
                item.constructor as ExtractSubjectType<subjectsType>,
        });

        this.logger.info(`END: getMemberAbility service`);
        return ability;
    }

}
