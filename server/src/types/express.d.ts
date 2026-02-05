import { UserRole } from '../models/User';

declare global {
  namespace Express {
    interface User {
      _id: any;
      id: string;
      email: string;
      role: UserRole;
      name: string;
      credits: number;
      profile?: {
        bio?: string;
        avatar?: string;
        earnings?: any;
      };
      subscription?: any;
      paypal?: any;
      createdAt?: Date;
      updatedAt?: Date;
    }
  }
}
