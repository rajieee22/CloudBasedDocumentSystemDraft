import type { Request, Response } from "express";
import { z } from "zod";
import { authenticateUser } from "../services/auth.service.js";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email and password."
    });
  }

  try {
    const user = await authenticateUser(
      validation.data.email,
      validation.data.password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    await regenerateSession(req);

    req.session.user = user;

    await saveSession(req);

    return res.json({
      success: true,
      message: "Login successful.",
      user
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process login."
    });
  }
}

export function getCurrentUser(req: Request, res: Response) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  return res.json({
    success: true,
    user: req.session.user
  });
}

export function logout(req: Request, res: Response) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to log out."
      });
    }

    res.clearCookie("cloud.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return res.json({
      success: true,
      message: "Logout successful."
    });
  });
}