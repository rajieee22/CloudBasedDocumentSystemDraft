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
