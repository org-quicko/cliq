import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { UserDto } from '../dtos';
import { User } from '../entities';
import { UserConverter } from './user.converter';

@Injectable()
export class UserPaginatedConverter extends PaginatedListConverter<
  User,
  UserDto
> {
  constructor(userConverter: UserConverter) {
    super({
      convert: (entity) => userConverter.convert(entity),
    });
  }
}
