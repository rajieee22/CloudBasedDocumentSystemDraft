import { pool } from "../config/database.js"
import { loadAuthenticatedUserById } from "./auth.service.js"
import type { AuthenticatedUser } from "../types/auth.js"

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

interface ProfessorRow {
  user_id: string
  email: string
  given_name: string
  middle_name: string | null
  family_name: string
  employee_number: string | null
  position_title: string | null
}

export interface StudentProfileUpdate {
  college: string
  department: string
  course: string
  collegeDeanUserId: string
  departmentChairpersonUserId: string
}

export class StudentProfileError extends Error {}

interface PersonnelRow {
  user_id: string
  email: string
  given_name: string
  middle_name: string | null
  family_name: string
  employee_number: string | null
  position_title: string | null
  college: string
  department: string
  roles: string[]
}

interface CourseRow {
  college: string
  department: string
  program: string
}

function formatName(
  givenName: string,
  middleName: string | null,
  familyName: string,
): string {
  return [givenName, middleName, familyName].filter(Boolean).join(" ")
}

function toSignatory(row: PersonnelRow): SignatoryOption {
  return {
    userId: row.user_id,
    name: formatName(row.given_name, row.middle_name, row.family_name),
    email: row.email,
    employeeNumber: row.employee_number,
    positionTitle: row.position_title,
  }
}

function normalizeCourse(program: string): string {
  const value = program.trim()

  if (value.toUpperCase() === "BSIT") {
    return "Bachelor of Science in Information Technology"
  }

  return value
}

export async function getAcademicOptions(): Promise<AcademicOptions> {
  const personnelResult = await pool.query<PersonnelRow>(`
    SELECT
      u.user_id::text AS user_id,
      u.email,
      u.given_name,
      u.middle_name,
      u.family_name,
      pp.employee_number,
      pp.position_title,
      pp.college,
      pp.department,
      COALESCE(
        array_agg(r.role_code) FILTER (WHERE r.role_code IS NOT NULL),
        ARRAY[]::varchar[]
      ) AS roles
    FROM personnel_profiles pp
    JOIN app_users u ON u.user_id = pp.user_id AND u.is_active = TRUE
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE r.role_code IN ('DEAN', 'CHAIRPERSON')
    GROUP BY
      u.user_id,
      pp.personnel_profile_id,
      pp.employee_number,
      pp.position_title,
      pp.college,
      pp.department
    ORDER BY pp.college, pp.department
  `)

  const deanMap = new Map<string, SignatoryOption>()
  const chairpersonMap = new Map<string, SignatoryOption>()

  for (const row of personnelResult.rows) {
    const signatory = toSignatory(row)
    const departmentKey = `${row.college}::${row.department}`

    if (row.roles.includes("DEAN") && !deanMap.has(row.college)) {
      deanMap.set(row.college, signatory)
    }

    if (
      row.roles.includes("CHAIRPERSON") &&
      !chairpersonMap.has(departmentKey)
    ) {
      chairpersonMap.set(departmentKey, signatory)
    }
  }

  const courseResult = await pool.query<CourseRow>(`
    SELECT DISTINCT sp.college, sp.department, sp.program
    FROM student_profiles sp
    WHERE sp.college IS NOT NULL
      AND sp.department IS NOT NULL
      AND sp.program IS NOT NULL
      AND btrim(sp.program) <> ''
    ORDER BY sp.college, sp.department, sp.program
  `)

  const courseMap = new Map<string, Set<string>>()

  for (const row of courseResult.rows) {
    const key = `${row.college}::${row.department}`
    const courses = courseMap.get(key) ?? new Set<string>()
    courses.add(normalizeCourse(row.program))
    courseMap.set(key, courses)
  }

  const colleges = [...deanMap.keys()].sort((a, b) => a.localeCompare(b))

  const departments = colleges.flatMap((college) => {
    const names = new Set<string>()

    for (const row of personnelResult.rows) {
      if (row.college === college && row.roles.includes("CHAIRPERSON")) {
        names.add(row.department)
      }
    }

    return [...names]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        college,
        name,
        chairperson: chairpersonMap.get(`${college}::${name}`) ?? null,
      }))
  })

  const courses = [...courseMap.entries()].flatMap(([key, names]) => {
    const separator = key.indexOf("::")
    const college = key.slice(0, separator)
    const department = key.slice(separator + 2)

    if (!deanMap.has(college) || !chairpersonMap.has(key)) {
      return []
    }

    return [...names]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        college,
        department,
        name,
      }))
  })

  const professorResult = await pool.query<ProfessorRow>(`
    SELECT DISTINCT
      u.user_id::text AS user_id,
      u.email,
      u.given_name,
      u.middle_name,
      u.family_name,
      pp.employee_number,
      pp.position_title
    FROM app_users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    LEFT JOIN personnel_profiles pp ON pp.user_id = u.user_id
    WHERE u.is_active = TRUE
      AND r.role_code = 'PROFESSOR'
    ORDER BY u.family_name, u.given_name, u.email
  `)

  const professors = professorResult.rows.map((row) => ({
    userId: row.user_id,
    name: formatName(row.given_name, row.middle_name, row.family_name),
    email: row.email,
    employeeNumber: row.employee_number,
    positionTitle: row.position_title,
  }))

  return {
    colleges,
    deans: colleges.map((college) => ({
      college,
      signatory: deanMap.get(college)!,
    })),
    departments,
    courses,
    professors,
  }
}

export async function updateStudentProfile(
  userId: string,
  update: StudentProfileUpdate,
): Promise<AuthenticatedUser> {
  const options = await getAcademicOptions()

  const college = update.college.trim()
  const department = update.department.trim()
  const course = update.course.trim()

  if (!options.colleges.includes(college)) {
    throw new StudentProfileError("Select a registered college.")
  }

  const departmentOption = options.departments.find(
    (option) => option.college === college && option.name === department,
  )

  if (!departmentOption || !departmentOption.chairperson) {
    throw new StudentProfileError(
      "Select a department with a registered chairperson.",
    )
  }

  const hasCourse = options.courses.some(
    (option) =>
      option.college === college &&
      option.department === department &&
      option.name === course,
  )

  if (!hasCourse) {
    throw new StudentProfileError("Select a course offered by that department.")
  }

  const dean = options.deans.find((option) => option.college === college)

  if (!dean || dean.signatory.userId !== update.collegeDeanUserId) {
    throw new StudentProfileError(
      "The College Dean must match the registered signatory for that college.",
    )
  }

  if (
    departmentOption.chairperson.userId !== update.departmentChairpersonUserId
  ) {
    throw new StudentProfileError(
      "The Department Chairperson must match the registered signatory for that department.",
    )
  }

  const result = await pool.query(
    `
    UPDATE student_profiles
    SET
      college = $1,
      department = $2,
      program = $3,
      college_dean_user_id = $4,
      department_chairperson_user_id = $5
    WHERE user_id = $6
    `,
    [
      college,
      department,
      course,
      dean.signatory.userId,
      departmentOption.chairperson.userId,
      userId,
    ],
  )

  if (result.rowCount !== 1) {
    throw new StudentProfileError(
      "No student profile is linked to this account.",
    )
  }

  const account = await loadAuthenticatedUserById(userId)

  if (!account) {
    throw new StudentProfileError("Unable to reload the updated account.")
  }

  return account
}
