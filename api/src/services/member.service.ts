import { Injectable, 
  // Logger,
   NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberConverter } from 'src/converters/member.converter';
import { CreateMemberDto, UpdateMemberDto } from 'src/dtos';
import { Member } from 'src/entities';
import { Repository, FindOptionsRelations } from 'typeorm';
import { LoggerService } from './logger.service';

@Injectable()
export class MemberService {

  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private memberConverter: MemberConverter,
    private logger: LoggerService,
  ) { }

  /**
   * Member sign up
   */
  async memberSignUp(programId: string, member: CreateMemberDto) {
    this.logger.info('START: memberSignUp service');
    
    const newMember = this.memberRepository.create({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      password: member.password,
      program: {
        programId
      }
    });
    const savedMember = await this.memberRepository.save(newMember);
  
    const memberDto = this.memberConverter.convert(savedMember);
    
    this.logger.info('END: memberSignUp service');
    return memberDto;
  }

  /**
   * Get member
   */
  async getMember(memberId: string) {
    this.logger.info('START: getMember service');
    
    const memberResult = await this.memberRepository.findOne({
      where: { memberId: memberId },
      relations: {
        promoterMembers: true,
      },
      select: {
        promoterMembers: {
          promoterId: true,
          role: true,
          status: true,
        }
      }
    });
  
    if (!memberResult) {
      this.logger.warn(`Failed to get member of ID: ${memberId}`);
      throw new NotFoundException(`Failed to get member of ID: ${memberId}.`);
    }
  
    this.logger.info('END: getMember service');
    return this.memberConverter.convert(memberResult);
  }

  /**
   * Get member entity
   */
  async getMemberEntity(memberId: string, relations: FindOptionsRelations<Member> = {}) {
    this.logger.info('START: getMemberEntity service');
    
    const memberResult = await this.memberRepository.findOne({
      where: { memberId: memberId },
      relations: {
        promoterMembers: true,
        ...relations
      },
      select: {
        promoterMembers: {
          promoterId: true,
          role: true,
          status: true,
        }
      }
    });
  
    if (!memberResult) {
      this.logger.warn(`Failed to get member of ID: ${memberId}`);
      throw new NotFoundException(`Failed to get member of ID: ${memberId}.`);
    }
  
    this.logger.info('END: getMemberEntity service');
    return memberResult;
  }

  async getMemberByEmail(email: string): Promise<Member | null> {
    this.logger.info('START: getMemberByEmail service');
    const memberResult = await this.memberRepository.findOne({ where: { email: email }, relations: { promoterMembers: true } });
    this.logger.info('END: getMemberByEmail service');
    return memberResult;
  }

  /**
   * Update member info
   */
  async updateMemberInfo(memberId: string, member: UpdateMemberDto) {
    this.logger.info('START: updateMemberInfo service');
    
    const memberResult = await this.memberRepository.findOne({
      where: { memberId: memberId },
    });
  
    if (!memberResult) {
      this.logger.warn(`Member does not exist: ${memberId}`);
      throw new Error(`Member does not exist.`);
    }
  
    await this.memberRepository.update(
      { memberId: memberId },
      { ...member, updatedAt: () => `NOW()` },
    );
  
    this.logger.info('END: updateMemberInfo service');
  }
  /**
   * Delete member
   */
  async deleteMember(memberId: string) {
    this.logger.info('START: deleteMember service');
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
    });

    if (!member) {
      this.logger.error('Member does not exist');
      throw new Error(`Member does not exist.`);
    }

    await this.memberRepository.delete({ memberId: memberId });
    this.logger.info('END: deleteMember service');
  }

  async memberExists(email: string, programId: string) {
    this.logger.info('START: memberExists service');
    const member = await this.memberRepository.findOne({
     where:{
      email: email,
      program: {
        programId: programId
      }
     },
     relations: {
      program: true
     }
    });
    console.log("member: ", member);
    this.logger.info('END: memberExists service');
    return member;
  }
}
