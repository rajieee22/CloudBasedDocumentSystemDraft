import { Router } from "express"

import { requireAuth, requireRole } from "../middleware/auth.middleware.js"

import {
  getStudentDashboardData,
  getApproverDashboardData,
} from "../controllers/dashboard.controller.js"

const router = Router()

// Student dashboard: STUDENT only
router.get(
  "/student",
  requireAuth,
  requireRole("STUDENT"),
  getStudentDashboardData,
)

// Administrative and academic personnel dashboard
router.get(
  "/approver",
  requireAuth,
  requireRole(
    "PROFESSOR",
    "ADVISER",
    "CHAIRPERSON",
    "DEAN",
    "REGISTRAR",
    "ADMIN",
    "WITHDRAW_CONTROLLER",
    "WITHDRAW_PROFESSOR",
    "ADD_CONTROLLER",
    "CLOSED_SUBJECT_INSTRUCTOR",
  ),
  getApproverDashboardData,
)

export default router
