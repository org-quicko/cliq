import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    user_id: string;
    email: string;
    type: string;
  };

  member: {
    member_id: string;
    email: string;
    type: string;
  }
}
