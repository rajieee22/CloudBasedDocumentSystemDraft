  import type { Request, Response, NextFunction } from "express";

  export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    next();
  }

  export function requireRole(...allowedRoles: string[]) {
    return (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const user = req.session.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required."
        });
      }

      const hasPermission = user.roles.some((role) =>
        allowedRoles.includes(role)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource."
        });
      }

      next();
    };
  }