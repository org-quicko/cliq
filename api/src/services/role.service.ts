/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from "@nestjs/common";
import { createMongoAbility as createAbility, AbilityBuilder, CreateAbility, ForcedSubject, MongoAbility as Ability, InferSubjects, ExtractSubjectType } from "@casl/ability";
import { Circle, Commission, Condition, Contact, Function, Link, Member, Program, ProgramPromoter, ProgramUser, Promoter, PromoterMember, Purchase, ReferralView, SignUp, User } from "../entities";
import { roleEnum } from "../enums";
import { UserService } from './user.service';
import { ProgramService } from './program.service';
import { LinkService } from "./link.service";
import { PromoterService } from "./promoter.service";
import { PromoterMemberService } from "./promoterMember.service";
import { MemberService } from './member.service';
import { CircleService } from "./circle.service";
import { FunctionService } from "./function.service";
import { ProgramPromoterService } from "./programPromoter.service";
import { LoggerService } from "./logger.service";

// manage is a keyword in CASL that means the admin can do anything
export const actions = ['manage', 'create', 'read', 'read_all', 'update', 'delete', 'invite_user', 'invite_member', 'remove_user', 'remove_member', 'include_promoter', 'remove_promoter', 'change_role'] as const;

export type actionsType = typeof actions[number];
export type subjectsType = InferSubjects<
    typeof Circle |
    typeof Commission |
    typeof Contact |
    typeof Function |
    typeof Condition |
    typeof Link |
    typeof Member |
    typeof Program |
    typeof ProgramUser |
    typeof Promoter |
    typeof PromoterMember |
    typeof ProgramPromoter |
    typeof Purchase |
    typeof ReferralView |
    typeof SignUp |
    typeof User
> | 'all';

export type AppAbility = Ability<[actionsType, subjectsType]>;
export const createAppAbility = createAbility as CreateAbility<AppAbility>;

const userResources = [Program, ProgramUser, ProgramPromoter, Function, Condition, Circle];
const memberResources = [Promoter, Contact, Purchase, SignUp, ReferralView];


@Injectable()
export class RoleService {

    constructor(
        private userService: UserService,
        private memberService: MemberService,
        private programService: ProgramService,
        private promoterService: PromoterService,
        private linkService: LinkService,
        private circleService: CircleService,
        private functionService: FunctionService,
        private programPromoterService: ProgramPromoterService,
        private promoterMemberService: PromoterMemberService,

        private logger: LoggerService,
    ) { }

    getProgramUserPermissions(user: User) {
        const programUserPermissions = {};

        user.programUsers.forEach(programUser => {
            programUserPermissions[programUser.programId] = programUser.role;
        });

        return programUserPermissions;
    }

    getPromoterMemberPermissions(member: Member) {
        const promoterMemberPermissions = {};
        member.promoterMembers.forEach(promoterMember => {
            promoterMemberPermissions[promoterMember.promoterId] = promoterMember.role;
        });

        return promoterMemberPermissions;
    }

    async getSubjects(request: any, requiredPermissions: { action: actionsType; subject: subjectsType }[]) {
        this.logger.info(`START: getSubjects service`);
        const subjectObjects = await Promise.all(
            requiredPermissions.map(({ action, subject }) => {

                const subjectUserId = request.params.user_id as string;
                const subjectProgramId = request.params.program_id as string;
                const subjectMemberId = request.params.member_id as string;
                const subjectPromoterId = request.params.promoter_id as string;

                if (subject === User) {
                    if (action === 'read' || action === 'create') return subject;

                    if (!subjectUserId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} for performing action on object`);
                    }
                    const user = new User()
                    user.userId = subjectUserId;
                    return user;
                } else if (subject === Program) {
                    if (action === 'read' || action === 'create') return subject;

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.programService.getProgramEntity(subjectProgramId);

                } else if (subject === ProgramUser) {
                    if (action === 'read' || action === 'create') return subject;

                    if (!subjectProgramId || !subjectUserId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.programService.getProgramUserRowEntity(subjectProgramId, subjectUserId);

                } else if (subject === Member) {

                    if (!subjectMemberId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} for performing action on object`);
                    }

                    const member = new Member();
                    member.memberId = subjectMemberId;
                    return member;
                    // return this.memberService.getMemberEntity(subjectMemberId);

                } else if (subject === ProgramPromoter) {
                    const subjectProgramId = request.params.program_id as string;

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.programPromoterService.getRandomProgramPromoter(subjectProgramId);

                } else if (subject === Promoter) {

                    if (!subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    const promoter = new Promoter();
                    promoter.promoterId = subjectPromoterId;
                    return promoter;
                    // return this.promoterService.getPromoterEntity(subjectPromoterId);

                } else if (subject === PromoterMember) {
                    const subjectPromoterId = request.params.program_id as string;
                    const subjectPromoterMemberId = request.params.member_id as string;

                    if (!subjectPromoterId || !subjectPromoterMemberId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.promoterMemberService.getPromoterMemberRowEntity(subjectPromoterId, subjectPromoterMemberId);

                } else if (subject === Link) {

                    if (!(subjectProgramId && subjectPromoterId)) {
                        throw new BadRequestException(`Error. Must provide one of Program ID and Promoter ID for performing action on object.`);
                    }

                    return this.linkService.getFirstLink(subjectProgramId, subjectPromoterId);

                } else if (subject === Circle) {

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide one of Program ID for performing action on object.`);
                    }

                    return this.circleService.getRandomCircle(subjectProgramId);
                } else if (subject === Function) {
                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide one of Program ID for performing action on object.`);
                    }

                    return this.functionService.getRandomFunction(subjectProgramId);
                }
                else {
                    return subject;
                }
            })
        );

        this.logger.info(`END: getSubjects service`);
        return subjectObjects;
    }

    createForUser(user: User) {

        const programUserPermissions = this.getProgramUserPermissions(user);

        const { can, build } = new AbilityBuilder<AppAbility>(createAbility);
        // can manage all if user is super admin (except for the things listed below)
        if (user.role === roleEnum.SUPER_ADMIN) {
            can('manage', userResources);
            can('read', Promoter);
        }

        for (const [programId, role] of Object.entries(programUserPermissions)) {

            can('read', [ReferralView, ProgramPromoter, Link, Circle, Program, Function], { programId });

            if (role === roleEnum.ADMIN || role === roleEnum.SUPER_ADMIN) {
                // can update program or invite other users to the program
                can(['update', 'invite_user'], Program, { programId });

                // can change other users' role and change other users' permissions from the program, if that user ain't the super admin
                can(['change_role', 'remove_user'], ProgramUser, { programId, role: { $ne: roleEnum.SUPER_ADMIN } });

                can('invite_user', ProgramUser, { programId });

                // can also perform all operations on circle, functions and links
                can('manage', [Link, Circle, Function], { programId });

            } else if (role === roleEnum.EDITOR) {
                can('manage', [Link, Circle, Function], { programId });
            }
        }

        can(['update', 'delete'], User, { userId: user.userId });

        can('read', User);

        can('read', Purchase);
        can('read', SignUp);
        can('read', Commission);

        const ability = build({
            detectSubjectType: item => item.constructor as ExtractSubjectType<subjectsType>
        });

        return ability;
    }

    createForMember(member: Member) {

        const promoterMemberPermissions = this.getPromoterMemberPermissions(member);

        const { can, build } = new AbilityBuilder<AppAbility>(createAppAbility);

        for (const [promoterId, role] of Object.entries(promoterMemberPermissions)) {

            can(['read'], Member, { promoterMembers: { promoterId } });
            can(['read'], ReferralView, { promoterId });
            can(['read'], Purchase, { promoter: { promoterId } });
            can(['read'], SignUp, { promoter: { promoterId } });
            can(['read'], Link, { promoterId });

            if (role === roleEnum.ADMIN) {
                can('manage', memberResources);
                // can update program or invite other users to the program
                can(['update', 'invite_member'], Promoter, { promoterId });

                // can remove other members and change other members' permissions from the program, if that user ain't the super admin
                can(['remove_member', 'change_role'], PromoterMember, { promoterId, role: roleEnum.VIEWER });

                can(['create', 'delete'], Link, { promoterId });

            }
        }

        can(['update', 'delete'], Member, { memberId: member.memberId });

        const ability = build({
            detectSubjectType: item => item.constructor as ExtractSubjectType<subjectsType>
        });

        return ability;
    }

    createEmpty() {
        const { build } = new AbilityBuilder<AppAbility>(createAppAbility);
        return build();
    }
} 