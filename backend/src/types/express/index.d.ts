import type { AccessTokenPayload } from "../../modules/auth/auth.tokens";

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware once the access token is verified. */
      user?: AccessTokenPayload;
    }
  }
}

export {};