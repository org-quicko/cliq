import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
} from 'typeorm';
import { Program } from '../entities/program.entity';
import { User } from '../entities/user.entity';
import { userRoleEnum } from '../enums';
import { ProgramUser } from '../entities/programUser.entity';
import { identity } from 'rxjs';

@EventSubscriber()
export class ProgramSubscriber implements EntitySubscriberInterface<Program> {
  listenTo() {
    return Program;
  }

  async afterInsert(event: InsertEvent<Program>) {
    await event.queryRunner.connect();

    await event.manager.transaction(async (manager) => {
      const superAdmin = await manager.findOne(User, {
        where: {
          role: userRoleEnum.SUPER_ADMIN,
        },
      });
      
          const programUserEntity = manager.create(ProgramUser, {
            programId: event.entity.programId,
            user: {
              userId: superAdmin!.userId,
            },
            role: userRoleEnum.SUPER_ADMIN,
          });

          await manager.save(ProgramUser, programUserEntity);
        
    });
  }

  async afterRemove(event: RemoveEvent<Program>) {
    await event.queryRunner.connect();

    await event.queryRunner.query(`
            REFRESH MATERIALIZED VIEW program_summary_mv WITH DATA;
    `);

    await event.manager.transaction(async (manager) => {
      await manager.delete(ProgramUser, {
        programId: event.entity?.programId,
      });
    });
  }
}
