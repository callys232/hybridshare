import type { JwtPayload } from "@hybridshare/shared/types/user";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
    }
  }
}
