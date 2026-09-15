import { auth } from '@/lib/auth';
import type * as authType from './types';

export class MainAuthService {
  async getAuthContext(input: authType.IGetAuthContextInput): Promise<authType.IAuthContext> {
    const { userId } = await auth();
    return {
      userId,
    }
  }
}
