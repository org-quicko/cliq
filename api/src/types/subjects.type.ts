import { InferSubjects } from "@casl/ability";
import { Contact } from "@org.quicko/core";
import { ApiKey, Circle, Commission, Condition, Link, Member, Program, Function, ProgramUser, Promoter, PromoterMember, ProgramPromoter, Purchase, ReferralView, PromoterStatsView, SignUp, User, Webhook } from "src/entities";

export type subjectsType =
    InferSubjects<
        typeof ApiKey
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
        | typeof PromoterStatsView
        | typeof SignUp
        | typeof User
        | typeof Webhook
    >
    | 'all';