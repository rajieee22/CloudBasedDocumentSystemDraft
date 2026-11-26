const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "")

import type { LoadRevisionPermit } from "../types"

interface ResubmitRequestResponse {
  success: boolean
  message: string
  request: {
    id: string
    referenceNumber: string
    status: string
    cycleNumber: number
    student: string
  }
}

// ============================================
// REQUEST DETAIL TYPES
// ============================================

export interface RequestSubject {
  subject_id: number
  revision_action: "ADD" | "WITHDRAW"
  course_number_section: string
  course_title: string
  units: number
  is_closed_subject: boolean
}

export interface RequestStudent {
  userId: string
  givenName: string
  middleName: string | null
  familyName: string
  fullName: string
  email: string
  studentNumber: string | null
  college: string | null
  department: string | null
  program: string | null
  yearLevel: number | null
}

export interface ApprovalHistoryItem {
  historyId: string
  action: string
  actorUserId: string | null
  actorName: string | null
  actorRole: string | null
  remarks: string | null
  createdAt: string | null
}

export interface WorkflowApprover {
  userId: string
  name: string | null
  status: string
  assignedAt: string | null
  actedAt: string | null
  remarks: string | null
}

export interface WorkflowStep {
  stepId: string
  stepOrder: number
  stepName: string
  roleName: string
  status: "Approved" | "Current" | "Pending" | "Rejected"
  approvers: WorkflowApprover[]
}

export interface WorkflowProgress {
  instanceId: string
  workflowStatus: string
  cycleNumber: number
  startedAt: string
  completedAt: string | null
  currentStep: WorkflowStep | null
  workflowSteps: WorkflowStep[]
  completedSteps: number
  totalSteps: number
  progressPercentage: number
}

export interface LoadRevisionDetails {
  academic_term: string
  school_year: string
  family_name: string
  given_name: string
  middle_name: string | null
  student_number: string
  permit_date: string
  college: string
  department: string
  course_year: string
  professor_name: string | null
  professor_user_id: string | null
  college_dean_name: string | null
  department_chairperson_name: string | null
  load_before_units: number
  load_before_hours: number
  load_after_units: number
  load_after_hours: number
  conflict_of_schedule: boolean
  subjects_dissolved: boolean
  other_reason: string | null
  student_signature_name: string
  subjects: RequestSubject[]
}

export interface ShifterApplicationDetails {
  current_program: string
  intended_program: string
  reason_for_shifting: string
}

export interface LeaveOfAbsenceDetails {
  current_academic_year: string
  semester: string
  reason_of_absence: string
}

export type RequestDetails = LoadRevisionDetails | ShifterApplicationDetails | LeaveOfAbsenceDetails | null

export interface RequestDetail {
  id: string
  referenceNumber: string
  documentCode: string
  documentName: string
  status: string
  submittedAt: string | null
  completedAt: string | null
  student: RequestStudent
  details: RequestDetails
  approvalHistory: ApprovalHistoryItem[]
  workflowProgress: WorkflowProgress | null
}

interface RequestDetailApiResponse {
  success: boolean
  message?: string
  request: RequestDetail
}

// ============================================
// REQUEST LIST TYPES
// ============================================

export interface RequestListItem {
  id: string
  type: string
  student: string
  date: string
  stage: string
  status: string
}

interface RequestListApiResponse {
  success: boolean
  message?: string
  requests: RequestListItem[]
}

// ============================================
// APPROVAL TYPES
// ============================================

interface ApprovalApiResponse {
  success: boolean
  message?: string
}

// ============================================
// REQUEST API ERROR
// ============================================

export class RequestApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "RequestApiError"
  }
}

// ============================================
// REQUEST DETAIL API
// ============================================

export async function getRequestDetailsApi(
  referenceNumber: string,
): Promise<RequestDetail> {
  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      },
    )
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that the backend is running.",
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new RequestApiError(
      data.message || "Unable to load request details.",
      response.status,
    )
  }

  if (!data.success || !data.request) {
    throw new Error(data.message || "Invalid request details response.")
  }

  return (data as RequestDetailApiResponse).request
}

// ============================================
// REQUEST LIST API
// ============================================

export async function getRequestsApi(): Promise<RequestListItem[]> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api/requests`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that the backend is running.",
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new RequestApiError(
      data.message || "Unable to retrieve requests.",
      response.status,
    )
  }

  if (!data.success || !Array.isArray(data.requests)) {
    throw new Error(data.message || "Invalid requests response.")
  }

  return (data as RequestListApiResponse).requests
}

// ============================================
// APPROVE REQUEST API
// ============================================

export async function approveRequestApi(
  referenceNumber: string,
): Promise<string> {
  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}/approve`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      },
    )
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that the backend is running.",
    )
  }

  const data = (await response.json().catch(() => ({}))) as ApprovalApiResponse

  if (!response.ok) {
    throw new RequestApiError(
      data.message || "Unable to approve this request.",
      response.status,
    )
  }

  if (!data.success) {
    throw new Error(data.message || "The approval was unsuccessful.")
  }

  return data.message || "Request approved successfully."
}

// ============================================
// REJECT REQUEST API
// ============================================

export async function rejectRequestApi(
  referenceNumber: string,
  remarks: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}/reject`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ remarks }),
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new RequestApiError(
      data.message || "Unable to reject request.",
      response.status,
    )
  }

  if (!data.success) {
    throw new Error(data.message || "Unable to reject request.")
  }

  return data
}

export async function returnRequestApi(
  referenceNumber: string,
  remarks: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}/return`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ remarks }),
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new RequestApiError(
      data.message || "Unable to return request for revision.",
      response.status,
    )
  }

  if (!data.success) {
    throw new Error(data.message || "Unable to return request for revision.")
  }

  return data
}

export async function resubmitLoadRevisionRequestApi(
  referenceNumber: string,
  permit: LoadRevisionPermit,
): Promise<ResubmitRequestResponse["request"]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}/resubmit`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
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

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to resubmit the Load Revision request.",
    )
  }

  return data.request
}

export async function resubmitShifterApplicationRequestApi(
  referenceNumber: string,
  data: {
    intendedProgram: string
    reason: string
  },
): Promise<ResubmitRequestResponse["request"]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}/resubmit`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intendedProgram: data.intendedProgram,
        reason: data.reason,
      }),
    },
  )

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to resubmit the Shifter's Application.",
    )
  }

  return result.request
}

export async function resubmitLeaveOfAbsenceRequestApi(
  referenceNumber: string,
  data: {
    currentAcademicYear: string
    semester: string
    reason: string
  },
): Promise<ResubmitRequestResponse["request"]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${encodeURIComponent(referenceNumber)}/resubmit`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentAcademicYear: data.currentAcademicYear,
        semester: data.semester,
        reason: data.reason,
      }),
    },
  )

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to resubmit the Leave of Absence request.",
    )
  }

  return result.request
}
