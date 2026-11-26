import { defaultPermit } from "../data/initialData"
import type { LoadRevisionDetails, RequestDetail } from "./requests"
import type { LoadRevisionPermit } from "../types"

export function mapLoadRevisionToPermit(
  details: LoadRevisionDetails,
  student: RequestDetail["student"],
): LoadRevisionPermit {
  return {
    ...defaultPermit,
    term: details.academic_term as LoadRevisionPermit["term"],
    schoolYear: details.school_year,
    familyName: details.family_name || student.familyName || "",
    givenName: details.given_name || student.givenName || "",
    middleName: details.middle_name ?? student.middleName ?? "",
    studentId: details.student_number || student.studentNumber || "",
    permitDate: details.permit_date?.slice(0, 10) || "",
    college: details.college || student.college || "",
    department: details.department || student.department || "",
    courseYear: details.course_year || "",
    professor: details.professor_name ?? "",
    professorUserId: details.professor_user_id ?? null,
    collegeDean: details.college_dean_name ?? "",
    departmentChairperson: details.department_chairperson_name ?? "",
    withdraw: details.subjects
      .filter((subject) => subject.revision_action === "WITHDRAW")
      .map((subject) => ({
        course: subject.course_number_section,
        title: subject.course_title,
        units: String(subject.units),
        closed: false,
      })),
    add: details.subjects
      .filter((subject) => subject.revision_action === "ADD")
      .map((subject) => ({
        course: subject.course_number_section,
        title: subject.course_title,
        units: String(subject.units),
        closed: subject.is_closed_subject,
      })),
    loadBeforeUnits: String(details.load_before_units ?? ""),
    loadBeforeHours: String(details.load_before_hours ?? ""),
    loadAfterUnits: String(details.load_after_units ?? ""),
    loadAfterHours: String(details.load_after_hours ?? ""),
    conflict: details.conflict_of_schedule,
    dissolved: details.subjects_dissolved,
    otherReason: details.other_reason ?? "",
    studentSignature: details.student_signature_name || "",
  }
}
