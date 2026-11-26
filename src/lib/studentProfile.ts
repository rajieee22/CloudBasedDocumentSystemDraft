import { apiRequest, type AuthenticatedUser } from "./auth"

export interface SignatoryOption {
  userId: string
  name: string
  email: string
  employeeNumber: string | null
  positionTitle: string | null
}

export interface CollegeDeanOption {
  college: string
  signatory: SignatoryOption
}

export interface DepartmentOption {
  college: string
  name: string
  chairperson: SignatoryOption | null
}

export interface CourseOption {
  college: string
  department: string
  name: string
}

export interface AcademicOptions {
  colleges: string[]
  deans: CollegeDeanOption[]
  departments: DepartmentOption[]
  courses: CourseOption[]
  professors: SignatoryOption[]
}

export interface StudentProfileUpdate {
  college: string
  department: string
  course: string
  collegeDeanUserId: string
  departmentChairpersonUserId: string
}

export interface StudentProfileStatus {
  complete: boolean
  missing: string[]
  message: string
}

const PROFILE_FIELDS: Array<{
  key: keyof Pick<AuthenticatedUser, "studentNumber" | "college" | "department" | "program" | "yearLevel">
  label: string
}> = [
  { key: "studentNumber", label: "student number" },
  { key: "college", label: "college" },
  { key: "department", label: "department" },
  { key: "program", label: "program" },
  { key: "yearLevel", label: "year level" },
]

export function getStudentProfileStatus(
  user: AuthenticatedUser,
): StudentProfileStatus {
  const missing = PROFILE_FIELDS.filter(({ key }) => {
    const value = user[key]
    return value === null || value === undefined || String(value).trim() === ""
  }).map(({ label }) => label)

  const complete = missing.length === 0
  const detail =
    missing.length === PROFILE_FIELDS.length
      ? "no active student profile is linked to it"
      : `the student profile is incomplete (${missing.join(", ")})`

  return {
    complete,
    missing,
    message: complete
      ? ""
      : `Your account (${user.email}) is signed in, but ${detail}. The backend requires that profile before it can submit a request. Ask the registrar or administrator to correct the existing student profile record. No request was sent.`,
  }
}

export async function getAcademicOptionsApi(): Promise<AcademicOptions> {
  const result = await apiRequest<{
    success: boolean
    options: AcademicOptions
  }>("/students/academic-options")

  return result.options
}

export async function updateStudentProfileApi(
  update: StudentProfileUpdate,
): Promise<AuthenticatedUser> {
  const result = await apiRequest<{
    success: boolean
    message?: string
    user: AuthenticatedUser
  }>("/students/profile", {
    method: "PATCH",
    body: JSON.stringify(update),
  })

  return result.user
}
