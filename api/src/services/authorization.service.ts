import { BadRequestException, Injectable } from '@nestjs/common';
import {
    createMongoAbility as createAbility,
    AbilityBuilder,
    CreateAbility,
    MongoAbility as Ability,
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
import { Request } from 'express';

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
        entityType: 'User' | 'Member' | 'Api User',
        request: Request,
        requiredPermissions: { action: actionsType; subject: subjectsType }[],
    ) {
        let subjectObjects: (subjectsType | null | undefined)[] = [];
        this.logger.info(`START: getSubjects service`);
        subjectObjects = await Promise.all(
            requiredPermissions.map(({ action, subject }) => {
                const subjectUserId = request.params.user_id as string | undefined;
                const subjectProgramId = request.params.program_id as string | undefined;
                const subjectMemberId = request.params.member_id as string | undefined;
                const subjectPromoterId = request.params.promoter_id as string | undefined;

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
                        throw new BadRequestException(`Error. Must provide a Program ID for performing action on object`);
                    }

                    return this.programService.getProgramEntity(
                        subjectProgramId,
                    );
                } else if (subject === ProgramUser) {
                    return this.checkIfUserIsPartOfProgram(request, subject);
                } else if (subject === Member) {

                    if (!subjectMemberId) {
                        throw new BadRequestException(`Error. Must provide a Member ID for performing action on object`);
                    }

                    return this.memberService.getMemberEntity(subjectMemberId);
                } else if (subject === ProgramPromoter) {
                    if (action === 'read_all') {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }

                    if (!subjectProgramId || !subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide Program ID and Promoter ID for performing action on object`);
                    }

                    // since user wants specific row, get the row from the database
                    return this.programPromoterService.getProgramPromoter(subjectProgramId, subjectPromoterId);

                } else if (subject === Promoter) {
                    if (action === 'create' || action === 'read_all') return subject;

                    if (!subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a Promoter ID for performing action on object`);
                    }

                    return this.promoterService.getPromoterEntity(
                        subjectPromoterId,
                        {
                            programPromoters: true
                        }
                    );
                } else if (subject === PromoterMember) {
                    return this.checkIfMemberIsPartOfPromoter(request, subject);
                } else if (subject === Link) {
                    if (entityType === 'Member') {
                        return this.checkIfMemberIsPartOfPromoter(request, subject);
                    } else {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }

                } else if (subject === Circle) {
                    return this.checkIfUserIsPartOfProgram(request, subject);

                } else if (subject === Function) {
                    return this.checkIfUserIsPartOfProgram(request, subject);
                } else if (subject === ApiKey) {
                    return this.checkIfUserIsPartOfProgram(request, subject);
                } else if (subject === ReferralView) {
                    if (entityType === 'Member') {
                        return this.checkIfMemberIsPartOfPromoter(request, subject);
                    } else {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }
                } else if (subject === PromoterAnalyticsView) {
                    if (entityType === 'Member') {
                        return this.checkIfMemberIsPartOfPromoter(request, subject);
                    } else {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }
                } else if (subject === Commission) {
                    if (entityType === 'Member') {
                        return this.checkIfMemberIsPartOfPromoter(request, subject);
                    } else {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }
                } else if (subject === SignUp) {
                    if (entityType === 'Member') {
                        return this.checkIfMemberIsPartOfPromoter(request, subject);
                    } else {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }
                } else if (subject === Purchase) {
                    if (entityType === 'Member') {
                        return this.checkIfMemberIsPartOfPromoter(request, subject);
                    } else {
                        return this.checkIfUserIsPartOfProgram(request, subject);
                    }
                } else if (subject === Webhook) {
                    return this.checkIfUserIsPartOfProgram(request, subject);
                } else if (subject === LinkAnalyticsView) {
                    return this.checkIfMemberIsPartOfPromoter(request, subject);
                }
                else {
                    return subject;
                }
            }),
        );

        this.logger.info(`END: getSubjects service`);
        return subjectObjects;
    }

    async checkIfUserIsPartOfProgram(request: Request, subject: subjectsType) {
        const subjectUserId = request.headers.user_id as string | undefined;
        const apiKey = request.headers['x-api-key'] as string | undefined;
        const apiSecret = request.headers['x-api-secret'] as string | undefined;

        const subjectProgramId = request.params.program_id as string | undefined;

        if (!subjectProgramId) {
            throw new BadRequestException(`Error. Must provide Program ID for performing action on object`);
        } else {
            if (!subjectUserId) {
                if (!apiKey || !apiSecret) {
                    throw new BadRequestException(`Error. Must provide Program ID and either User ID or API Key-secret pair for performing action on object`);
                } else {
                    if (subjectProgramId && subjectProgramId !== (request.headers.program_id as string)) {
                        // trying to access a different program's information
                        return null;
                    }
                    return subject;
                }
            } else {
                return this.programService.checkIfUserExistsInProgram(subjectUserId, subjectProgramId, subject);
            }
        }
    }

    async checkIfMemberIsPartOfPromoter(request: Request, subject: subjectsType) {
        const subjectMemberId = request.headers.member_id as string | undefined;
        const apiKey = request.headers['x-api-key'] as string | undefined;
        const apiSecret = request.headers['x-api-secret'] as string | undefined;

        const subjectProgramId = request.params.program_id as string | undefined;
        const subjectPromoterId = request.params.promoter_id as string | undefined;

        if (!subjectPromoterId) {
            throw new BadRequestException(`Error. Must provide Promoter ID for performing action on object`);
        } else {
            if (!subjectMemberId) {
                if (!apiKey || !apiSecret) {
                    throw new BadRequestException(`Error. Must provide Promoter ID and either Member ID or API Key-secret pair for performing action on object`);
                } else {
                    if (subjectProgramId && subjectProgramId !== (request.headers.program_id as string)) {
                        // trying to access a different program's information
                        return null;
                    }
                    return subject;
                }
            } else {
                return this.promoterService.memberExistsInPromoter(subjectMemberId, subjectPromoterId, subject);
            }
        }
    }
    
    // TODO: systematize the action: subject pair in a JSON format and then automatically create abilities for all 3 users

    getUserAbility(user: User) {
        this.logger.info(`START: getUserAbility service`);

        const programUserPermissions = this.getProgramUserPermissions(user);

        const { can: allow, build } = new AbilityBuilder<AppAbility>(createAbility);

        // can manage all if user is super admin (except for the things listed below)
        if (user.role === userRoleEnum.SUPER_ADMIN) {
            allow('manage', userResources);
            allow('manage', Promoter);
        }

        // will only return the programs that the user is part of
        allow('read_all', Program);

        for (const [programId, role] of Object.entries(programUserPermissions)) {
            allow(['read', 'read_all'], [ReferralView, PromoterAnalyticsView, ProgramPromoter, Link, Circle, Function, Webhook, ApiKey], { programId });
            allow('read', User, { programUsers: { $elemMatch: { programId } } });
            allow(['read', 'read_all'], LinkAnalyticsView);

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

        allow(['read', 'update', 'delete'], User, { userId: user.userId });
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
        allow('create', [Link, User]);
        allow(['read', 'read_all', 'delete'], Link, { programId });
        allow<User>('create', Promoter, { programUsers: { $elemMatch: { programId } } });
        allow(['read', 'update', 'delete'], Promoter, { programPromoters: { $elemMatch: { programId } } });
        allow('register', Promoter);
        

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
        allow(['read', 'read_all'], LinkAnalyticsView);

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

                // can only manage the program-promoter relations if you are admin of this promoter
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
