import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole, AccountStatus } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: AccountStatus;
      referralCode: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    status: AccountStatus;
    referralCode: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: AccountStatus;
    referralCode: string;
  }
}
