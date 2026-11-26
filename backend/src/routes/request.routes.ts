import { Router } from "express"

import { requireAuth, requireRole } from "../middleware/auth.middleware.js"

import {
  createLoadRevision,
  createShifterApplication,
  createLeaveOfAbsence,
  getRequestsController,
  getRequestDetailsController,
  approveRequestController,
  rejectRequestController,
  returnRequestController,
  resubmitRequestController,
} from "../controllers/request.controller.js"

const router = Router()

// Academic Load Revision Permit
router.post(
  "/load-revision",
  requireAuth,
  requireRole("STUDENT"),
  createLoadRevision,
)

// Shifter's Application Form
router.post(
  "/shifter-application",
  requireAuth,
  requireRole("STUDENT"),
  createShifterApplication,
)

// Leave of Absence Form
router.post(
  "/leave-of-absence",
  requireAuth,
  requireRole("STUDENT"),
  createLeaveOfAbsence,
)

// Retrieve all accessible requests
router.get("/", requireAuth, getRequestsController)

// Retrieve one request using its reference number
router.get("/:referenceNumber", requireAuth, getRequestDetailsController)

// Approve the current workflow step
router.post(
  "/:referenceNumber/approve",
  requireAuth,
  requireRole("PROFESSOR", "ADVISER", "CHAIRPERSON", "DEAN", "REGISTRAR"),
  approveRequestController,
)

router.post(
  "/:referenceNumber/reject",
  requireAuth,
  requireRole("PROFESSOR", "ADVISER", "CHAIRPERSON", "DEAN", "REGISTRAR"),
  rejectRequestController,
)

router.post(
  "/:referenceNumber/return",
  requireAuth,
  requireRole("PROFESSOR", "ADVISER", "CHAIRPERSON", "DEAN", "REGISTRAR"),
  returnRequestController,
)

router.post(
  "/:referenceNumber/resubmit",
  requireAuth,
  requireRole("STUDENT"),
  resubmitRequestController,
)

export default router
