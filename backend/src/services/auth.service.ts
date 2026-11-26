import argon2 from "argon2"

import { pool } from "../config/database.js"
import type { AuthenticatedUser } from "../types/auth.js"

interface LoginAccount extends AuthenticatedUser {
  passwordHash: string
}

const ACCOUNT_SELECT = `
  SELECT
    u.user_id::text AS id,
    u.email,
    u.password_hash AS "passwordHash",
    u.given_name AS "givenName",
    u.middle_name AS "middleName",
    u.family_name AS "familyName",

    sp.student_number AS "studentNumber",
    sp.college,
    sp.department,
    sp.program,
    sp.year_level AS "yearLevel",
    sp.professor_user_id::text AS "professorUserId",
    sp.college_dean_user_id::text AS "collegeDeanUserId",
    sp.department_chairperson_user_id::text AS "departmentChairpersonUserId",

    NULLIF(
      CONCAT_WS(' ', professor.given_name, professor.middle_name, professor.family_name),
      ''
    ) AS "professorName",
    NULLIF(
      CONCAT_WS(' ', dean.given_name, dean.middle_name, dean.family_name),
      ''
    ) AS "collegeDeanName",
    NULLIF(
      CONCAT_WS(' ', chairperson.given_name, chairperson.middle_name, chairperson.family_name),
      ''
    ) AS "departmentChairpersonName",

    COALESCE(
      (
        SELECT array_agg(r.role_code)
        FROM user_roles ur
        JOIN roles r ON r.role_id = ur.role_id
        WHERE ur.user_id = u.user_id
      ),
      ARRAY[]::varchar[]
    ) AS roles

  FROM app_users u

  LEFT JOIN student_profiles sp
    ON sp.user_id = u.user_id

  LEFT JOIN app_users professor
    ON professor.user_id = sp.professor_user_id

  LEFT JOIN app_users dean
    ON dean.user_id = sp.college_dean_user_id

  LEFT JOIN app_users chairperson
    ON chairperson.user_id = sp.department_chairperson_user_id
`

export async function loadAuthenticatedUserById(
  userId: string,
): Promise<AuthenticatedUser | null> {
  const result = await pool.query<AuthenticatedUser>(
    `${ACCOUNT_SELECT} WHERE u.user_id = $1 AND u.is_active = TRUE`,
    [userId],
  )

  return result.rows[0] ?? null
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const result = await pool.query<LoginAccount>(
    `${ACCOUNT_SELECT}
     WHERE LOWER(u.email) = LOWER($1)
       AND u.is_active = TRUE`,
    [email],
  )

  const account = result.rows[0]

  if (!account) {
    return null
  }

  try {
    if (!(await argon2.verify(account.passwordHash, password))) {
      return null
    }
  } catch {
    return null
  }

  const { passwordHash: _passwordHash, ...user } = account

  return user
}
