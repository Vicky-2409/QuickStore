import { Request } from "express";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}
