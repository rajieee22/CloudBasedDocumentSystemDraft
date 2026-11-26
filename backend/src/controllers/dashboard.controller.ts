
import type { Request, Response } from "express";
import {
  getStudentDashboard,
  getApproverDashboard
} from "../services/dashboard.service.js";

// ============================================
// STUDENT DASHBOARD
// ============================================

export async function getStudentDashboardData(
  req: Request,
  res: Response
) {
  const authenticatedUser = req.session.user;

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  try {
    const dashboard = await getStudentDashboard(authenticatedUser.id);

    return res.status(200).json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error("Student dashboard retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your dashboard. Please try again."
    });
  }
}

// ============================================
// APPROVER DASHBOARD
// ============================================

export async function getApproverDashboardData(
  req: Request,
  res: Response
) {
  const authenticatedUser = req.session.user;

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  try {
    const dashboard = await getApproverDashboard(authenticatedUser.id);

    return res.status(200).json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error("Approver dashboard retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the approver dashboard. Please try again."
    });
  }
}
