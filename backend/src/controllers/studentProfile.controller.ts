import type { Request, Response } from "express"
import { z } from "zod"

import {
  getAcademicOptions,
  StudentProfileError,
  updateStudentProfile,
} from "../services/studentProfile.service.js"

const updateSchema = z.object({
  college: z.string().trim().min(1).max(120),
  department: z.string().trim().min(1).max(120),
  course: z.string().trim().min(1).max(120),
  collegeDeanUserId: z.string().trim().min(1),
  departmentChairpersonUserId: z.string().trim().min(1),
})

export async function getAcademicOptionsController(
  _req: Request,
  res: Response,
) {
  try {
    const options = await getAcademicOptions()

    return res.json({
      success: true,
      options,
    })
  } catch (error) {
    console.error("Academic options loading failed:", error)

    return res.status(500).json({
      success: false,
      message: "Unable to load academic options.",
    })
  }
}

export async function updateProfile(req: Request, res: Response) {
  const validation = updateSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please complete all student information fields.",
    })
  }

  try {
    const user = await updateStudentProfile(
      req.session.user!.id,
      validation.data,
    )

    req.session.user = { ...req.session.user!, ...user }

    return res.json({
      success: true,
      message: "Student information updated.",
      user,
    })
  } catch (error) {
    if (error instanceof StudentProfileError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Student profile update failed:", error)

    return res.status(500).json({
      success: false,
      message: "Unable to update student information.",
    })
  }
}
