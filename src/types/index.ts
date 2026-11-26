export type AppRole = "STUDENT" | "PROFESSOR" | "ADVISER" | "CHAIRPERSON" | "DEAN" | "REGISTRAR" | "ADMIN" | "WITHDRAW_CONTROLLER" | "WITHDRAW_PROFESSOR" | "ADD_CONTROLLER" | "CLOSED_SUBJECT_INSTRUCTOR"

export type Role = "student" | "approver"
export type Page = "login" | "dashboard" | "new" | "form" | "requests" | "processed" | "detail" | "review" | "signature" | "notifications" | "settings"
export type Status = "Pending" | "Approved" | "Rejected" | "Returned for Revision" | "Completed"

export type SubjectRow = {
  course: string
  title: string
  units: string
  closed?: boolean
}

export type LoadRevisionPermit = {
  term: "1st Semester" | "2nd Semester" | "Summer Term"
  schoolYear: string
  familyName: string
  givenName: string
  middleName: string
  studentId: string
  permitDate: string
  college: string
  department: string
  courseYear: string
  professor: string
  professorUserId: string | null
  collegeDean: string
  departmentChairperson: string
  withdraw: SubjectRow[]
  add: SubjectRow[]
  loadBeforeUnits: string
  loadBeforeHours: string
  loadAfterUnits: string
  loadAfterHours: string
  conflict: boolean
  dissolved: boolean
  otherReason: string
  studentSignature: string
  signatures: Record<string, string>
}

export interface StudentDashboardData {
  stats: {
    total: number
    pending: number
    approved: number
    returned: number
    rejected: number
    completed: number
  }
  recentRequests: RequestItem[]
  activeRequest: RequestItem | null
}

export type RequestItem = {
  id: string
  type: string
  student: string
  date: string
  stage: string
  status: Status
  reason?: string
  permit?: LoadRevisionPermit
}
