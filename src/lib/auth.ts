import type { LoadRevisionPermit } from "../types"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "")

export interface AuthenticatedUser {
  id: string
  email: string
  givenName: string
  middleName: string | null
  familyName: string
  roles: string[]
  studentNumber: string | null
  college: string | null
  department: string | null
  program: string | null
  yearLevel: number | null
  professorUserId: string | null
  professorName: string | null
  collegeDeanUserId: string | null
  collegeDeanName: string | null
  departmentChairpersonUserId: string | null
  departmentChairpersonName: string | null
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  user: T
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that the backend is running.",
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(
      data.message || "Unable to communicate with the server.",
      response.status,
    )
  }

  return data as T
}

export async function loginApi(
  email: string,
  password: string,
): Promise<AuthenticatedUser> {
  const result = await apiRequest<ApiResponse<AuthenticatedUser>>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  )

  return result.user
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const result = await apiRequest<ApiResponse<AuthenticatedUser>>("/auth/me")

    return result.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }

    throw error
  }
}

export async function logoutApi(): Promise<void> {
  await apiRequest<{ success: boolean }>("/auth/logout", {
    method: "POST",
  })
}

// Load Revision Permit API
interface LoadRevisionApiResponse {
  success: boolean
  message: string
  request: {
    id: string
    referenceNumber: string
    status: string
    submittedAt: string
    student: string
  }
}

export async function submitLoadRevisionApi(
  permit: LoadRevisionPermit,
): Promise<LoadRevisionApiResponse["request"]> {
  const result = await apiRequest<LoadRevisionApiResponse>(
    "/requests/load-revision",
    {
      method: "POST",
      body: JSON.stringify({
        term: permit.term,
        schoolYear: permit.schoolYear,
        permitDate: permit.permitDate,
        professor: permit.professor,
        professorUserId: permit.professorUserId,
        collegeDean: permit.collegeDean,
        departmentChairperson: permit.departmentChairperson,

        withdraw: permit.withdraw.map((subject) => ({
          course: subject.course,
          title: subject.title,
          units: Number(subject.units),
          closed: false,
        })),

        add: permit.add.map((subject) => ({
          course: subject.course,
          title: subject.title,
          units: Number(subject.units),
          closed: Boolean(subject.closed),
        })),

        loadBeforeUnits: Number(permit.loadBeforeUnits),
        loadBeforeHours: Number(permit.loadBeforeHours),
        loadAfterUnits: Number(permit.loadAfterUnits),
        loadAfterHours: Number(permit.loadAfterHours),

        conflict: permit.conflict,
        dissolved: permit.dissolved,
        otherReason: permit.otherReason,
      }),
    },
  )

  return result.request
}

// Shifter's Application API
export interface ShifterApplicationSubmission {
  intendedProgram: string
  reason: string
}

interface ShifterApplicationApiResponse {
  success: boolean
  message: string
  request: {
    id: string
    referenceNumber: string
    status: string
    submittedAt: string
    student: string
  }
}

export async function submitShifterApplicationApi(
  data: ShifterApplicationSubmission,
): Promise<ShifterApplicationApiResponse["request"]> {
  const result = await apiRequest<ShifterApplicationApiResponse>(
    "/requests/shifter-application",
    {
      method: "POST",
      body: JSON.stringify({
        intendedProgram: data.intendedProgram,
        reason: data.reason,
      }),
    },
  )

  return result.request
}

// Leave of Absence submission data
export interface LeaveOfAbsenceSubmission {
  currentAcademicYear: string
  semester: string
  reason: string
}

interface LeaveOfAbsenceApiResponse {
  success: boolean
  message: string
  request: {
    id: string
    referenceNumber: string
    status: string
    submittedAt: string
    student: string
  }
}

// Leave of Absence API
export async function submitLeaveOfAbsenceApi(
  data: LeaveOfAbsenceSubmission,
): Promise<LeaveOfAbsenceApiResponse["request"]> {
  const result = await apiRequest<LeaveOfAbsenceApiResponse>(
    "/requests/leave-of-absence",
    {
      method: "POST",
      body: JSON.stringify({
        currentAcademicYear: data.currentAcademicYear,
        semester: data.semester,
        reason: data.reason,
      }),
    },
  )

  return result.request
}
