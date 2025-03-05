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

const userResources = [Program, ProgramUser, Function, Condition, Circle];
const memberResources = [Promoter, Contact, Purchase, SignUp, ReferralView];


@Injectable()
export class RoleService {

    constructor(
        private userService: UserService,
        private memberService: MemberService,
        private programService: ProgramService,
        private promoterService: PromoterService,
        private linkService: LinkService,
        private promoterMemberService: PromoterMemberService,

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

        const subjectObjects = await Promise.all( 
            requiredPermissions.map(({ action, subject }) => {

                if (subject === User) {
                    if (action === 'read' || action === 'create') return subject;

                    const subjectUserId = request.params.user_id as string;

                    if (!subjectUserId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} for performing action on object`);
                    }
                    return this.userService.getUserEntity(subjectUserId);
                } else if (subject === Program) {
                    if (action === 'read' || action === 'create') return subject;

                    const subjectProgramId = request.params.program_id as string;

                    if (!subjectProgramId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.programService.getProgramEntity(subjectProgramId);

                } else if (subject === ProgramUser) {
                    if (action === 'read' || action === 'create') return subject;

                    const subjectProgramId = request.params.program_id as string;
                    const subjectProgramUserId = request.params.user_id as string;

                    if (!subjectProgramId || !subjectProgramUserId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.programService.getProgramUserRowEntity(subjectProgramId, subjectProgramUserId);

                } else if (subject === Member) {
                    const subjectMemberId = request.params.member_id as string;

                    if (!subjectMemberId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} for performing action on object`);
                    }
                    return this.memberService.getMemberEntity(subjectMemberId);

                } else if (subject === Promoter) {
                    const subjectPromoterId = request.params.promoter_id as string;

                    if (!subjectPromoterId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.promoterService.getPromoterEntity(subjectPromoterId);

                } else if (subject === PromoterMember) {
                    const subjectPromoterId = request.params.program_id as string;
                    const subjectPromoterMemberId = request.params.member_id as string;

                    if (!subjectPromoterId || !subjectPromoterMemberId) {
                        throw new BadRequestException(`Error. Must provide a ${typeof subject} ID for performing action on object`);
                    }

                    return this.promoterMemberService.getPromoterMemberRowEntity(subjectPromoterId, subjectPromoterMemberId);

                } else if (subject === Link) {
                    const subjectProgramId = request.params.program_id as string;
                    const subjectPromoterId = request.params.promoter_id as string;

                    if (!(subjectProgramId && subjectPromoterId)) {
                        throw new BadRequestException(`Error. Must provide one of Program ID and Promoter ID for performing action on object.`);
                    }

                    return this.linkService.getRandomLink(subjectProgramId, subjectPromoterId);
                } 
                else {
                    return subject;
                }
            })
        );

        return subjectObjects;
    }

    createForUser(user: User) {

        const programUserPermissions = this.getProgramUserPermissions(user);

        const { can, build } = new AbilityBuilder<AppAbility>(createAbility);
        // can manage all if user is super admin (except for the things listed below)
        if (user.isSuperAdmin) {
            can('manage', userResources);
            can('read', Promoter);
            can('create', User);
        } else {
            can('read', userResources);
        }
        
        for (const [programId, role] of Object.entries(programUserPermissions)) {
            
            can('read', Contact, { program: { programId } });
            can('read', ReferralView, { programId });
            can('read', ProgramPromoter, { programId });
            
            if (role === roleEnum.ADMIN) {
                
                // can update program or invite other users to the program
                can(['update', 'invite_user'], Program, { programId });
                
                // can change other users' role and change other users' permissions from the program, if that user ain't the super admin
                can(['change_role', 'invite_user'], ProgramUser, { programId, user: { isSuperAdmin: false } });

                // can only remove users if they aren't the super user
                can(['remove_user'], ProgramUser, { programId, user: { isSuperAdmin: false } });
                
                // can also perform all operations on circle
                can(['manage'], Circle, { program: { programId } });

                can(['manage'], Link, { programId });
            } else {
                can(['read'], Link, { programId });
            }
        }
        
        
        
        can(['update', 'delete'], User, { userId: user.userId });
        can(['read'], User);
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

        // can manage all if user is super admin (except for the things listed below)
        if (member.isSuperAdmin) {
            can('manage', memberResources);
            can('create', Member);
        } else {
            can('read', memberResources);
        }

        for (const [promoterId, role] of Object.entries(promoterMemberPermissions)) {
            
            can(['read'], Member, { promoterMembers: { promoterId } });
            can(['read'], ReferralView, { promoterId });
            can(['read'], Purchase, { promoter: { promoterId } });
            can(['read'], SignUp, { promoter: { promoterId } });
            can(['read'], Link, { promoterId }); 
            
            if (role === roleEnum.ADMIN) {
                // can update program or invite other users to the program
                can(['update', 'invite_member'], Promoter, { promoterId });

                // can remove other members and change other members' permissions from the program, if that user ain't the super admin
                can(['remove_member', 'change_role'], PromoterMember, { promoterId, member: { isSuperAdmin: false } });

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
        const { can, build } = new AbilityBuilder<AppAbility>(createAppAbility);
        return build();
    }
} 