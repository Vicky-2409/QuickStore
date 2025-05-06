import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  userEmail?: string;
}

export const isAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Received request headers:", req.headers);
    console.log("Received request body:", req.body);

    const userEmail =
      (req.headers["x-user-email"] as string) || req.body.userEmail;
    console.log("User email from request:", userEmail);

    if (!userEmail) {
      console.log("No user email found in request");
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: User email not provided in headers or request body",
      });
    }

    // Add user email to request object for use in controllers
    req.userEmail = userEmail;

    console.log("Authentication successful for user:", userEmail);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
