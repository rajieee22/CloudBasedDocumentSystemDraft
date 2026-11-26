import { Router } from "express"

import { requireAuth, requireRole } from "../middleware/auth.middleware.js"
import {
  getAcademicOptionsController,
  updateProfile,
} from "../controllers/studentProfile.controller.js"

const router = Router()

router.get("/academic-options", requireAuth, getAcademicOptionsController)
router.patch("/profile", requireAuth, requireRole("STUDENT"), updateProfile)

export default router
