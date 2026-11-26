import type { AuthenticatedUser } from "./auth.js";

declare module "express-session" {
  interface SessionData {
    user?: AuthenticatedUser;
  }
}

export {};