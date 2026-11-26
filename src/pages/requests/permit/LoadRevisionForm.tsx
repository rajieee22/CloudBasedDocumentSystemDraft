import { Fragment, useEffect, useState, type FormEvent } from "react"
import type { LoadRevisionPermit } from "../../../types"
import { Button, Field, Icon, Modal } from "../../../components/ui"
import { defaultPermit } from "../../../data/initialData"
import { SubjectEditor } from "./SubjectEditor"
import type { AuthenticatedUser } from "../../../lib/auth"
import {
  getAcademicOptionsApi,
  getStudentProfileStatus,
  type AcademicOptions,
} from "../../../lib/studentProfile"
import {
  useLatestWorkflowAssignments,
  type AssignmentKey,
} from "../../../lib/workflowAssignments"
import { ProfessorPicker } from "./ProfessorPicker"

export function LoadRevisionForm({
  cancel,
  submit,
  initialData,
  isResubmission = false,
  studentProfile,
}: {
  cancel: () => void
  submit: (permit: LoadRevisionPermit) => void
  initialData?: LoadRevisionPermit
  isResubmission?: boolean
  studentProfile: AuthenticatedUser
}) {
  const [data, setData] = useState<LoadRevisionPermit>(() => {
    if (initialData) return initialData

    return {
      ...defaultPermit,
      familyName: studentProfile.familyName,
      givenName: studentProfile.givenName,
      middleName: studentProfile.middleName ?? "",
      studentId: studentProfile.studentNumber ?? "",
      college: studentProfile.college ?? "",
      department: studentProfile.department ?? "",
      courseYear: [
        studentProfile.program,
        studentProfile.yearLevel
          ? `${studentProfile.yearLevel}${
              studentProfile.yearLevel === 1
                ? "st"
                : studentProfile.yearLevel === 2
                  ? "nd"
                  : studentProfile.yearLevel === 3
                    ? "rd"
                    : "th"
            } Year`
          : "",
      ]
        .filter(Boolean)
        .join(" – "),
      professor: "",
      professorUserId: null,
      collegeDean: "",
      departmentChairperson: "",
      studentSignature: [
        studentProfile.givenName,
        studentProfile.middleName,
        studentProfile.familyName,
      ]
        .filter(Boolean)
        .join(" "),
    }
  })
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState("")
  const profileStatus = getStudentProfileStatus(studentProfile)
  const assignmentsState = useLatestWorkflowAssignments()
  const [academicOptions, setAcademicOptions] =
    useState<AcademicOptions | null>(null)
  const [professorOptionsError, setProfessorOptionsError] = useState("")

  useEffect(() => {
    let active = true

    getAcademicOptionsApi()
      .then((options) => {
        if (active) setAcademicOptions(options)
      })
      .catch(() => {
        if (active) {
          setProfessorOptionsError(
            "Unable to load registered professors. You can still enter a name manually.",
          )
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!academicOptions) return

    const dean = academicOptions.deans.find(
      (option) =>
        option.college === studentProfile.college &&
        option.signatory.userId === studentProfile.collegeDeanUserId,
    )?.signatory.name

    const chairperson = academicOptions.departments.find(
      (option) =>
        option.college === studentProfile.college &&
        option.name === studentProfile.department &&
        option.chairperson?.userId ===
          studentProfile.departmentChairpersonUserId,
    )?.chairperson?.name

    setData((current) =>
      current.collegeDean === (dean ?? "") &&
      current.departmentChairperson === (chairperson ?? "")
        ? current
        : {
            ...current,
            collegeDean: dean ?? "",
            departmentChairperson: chairperson ?? "",
          },
    )
  }, [
    academicOptions,
    studentProfile.college,
    studentProfile.department,
    studentProfile.collegeDeanUserId,
    studentProfile.departmentChairpersonUserId,
  ])

  const approvalRoles: Array<{
    key: AssignmentKey
    label: string
    step: string
  }> = [
    { key: "professor", label: "Professor", step: "Step 1" },
    { key: "adviser", label: "Academic adviser", step: "Step 2" },
    { key: "chairperson", label: "Department chairperson", step: "Step 3" },
    { key: "dean", label: "College dean", step: "Step 4" },
    { key: "registrar", label: "University registrar", step: "Step 5" },
  ]

  function assignedName(key: AssignmentKey) {
    return (
      assignmentsState.assignments?.roles.find((role) => role.key === key)
        ?.name ?? null
    )
  }

  function approverLabel(key: AssignmentKey) {
    if (key === "professor") {
      return data.professor.trim()
        ? `Entered: ${data.professor.trim()} (${
            data.professorUserId ? "registered" : "manual"
          })`
        : null
    }

    const name = assignedName(key)
    return name ? `Registered: ${name}` : null
  }

  const set = <K extends keyof LoadRevisionPermit,>(
    field: K,
    value: LoadRevisionPermit[K],
  ) => setData((current) => ({ ...current, [field]: value }))

  function validate(e: FormEvent) {
    e.preventDefault()

    if (!profileStatus.complete) {
      setError(profileStatus.message)
      return
    }

    const required = [
      data.term,
      data.schoolYear,
      data.familyName,
      data.givenName,
      data.studentId,
      data.permitDate,
      data.college,
      data.department,
      data.courseYear,
      data.professor,
      data.loadBeforeUnits,
      data.loadBeforeHours,
      data.loadAfterUnits,
      data.loadAfterHours,
      data.studentSignature,
    ]

    if (required.some((value) => !String(value).trim())) {
      setError("Complete all fields marked * before continuing.")
      return
    }

    const invalidRows = [...data.withdraw, ...data.add].some(
      (row) =>
        !row.course.trim() ||
        !row.title.trim() ||
        !Number.isFinite(Number(row.units)) ||
        Number(row.units) <= 0,
    )

    if (invalidRows) {
      setError(
        "Every subject row needs a course, a title, and a positive number of units.",
      )
      return
    }

    const loads = [
      data.loadBeforeUnits,
      data.loadBeforeHours,
      data.loadAfterUnits,
      data.loadAfterHours,
    ].map(Number)

    if (loads.some((value) => !Number.isFinite(value) || value < 0)) {
      setError("Academic load values must be non-negative numbers.")
      return
    }

    if (!data.conflict && !data.dissolved && !data.otherReason.trim()) {
      setError(
        "Select at least one reason or enter another reason for revision.",
      )
      return
    }

    setError("")
    setConfirm(true)
  }
  return (
    <>
      <div className="form-page-head">
        <button className="back-link" onClick={cancel}>
          ← Back to forms
        </button>
        <span>Official Registrar Form · FM-MSU-IIT-RGTR-008</span>
        <h2>
          {isResubmission
            ? "Revise and Resubmit Academic Load Permit"
            : "Academic Load Revision Permit"}
        </h2>
        <p>
          {isResubmission
            ? "Update the requested information based on the return remarks, then resubmit your permit."
            : "Complete the student portions of the official permit. Signature fields for university personnel are read-only."}
        </p>
      </div>
      <form className="request-form permit-form" onSubmit={validate}>
        {!profileStatus.complete && (
          <div className="form-error-banner profile-notice" role="alert">
            <Icon name="x" size={17} />
            <span>{profileStatus.message}</span>
          </div>
        )}
        <section className="form-section">
          <div className="section-number">1</div>
          <div className="section-body">
            <div className="section-title">
              <h3>Academic term</h3>
              <p>Select the term covered by this permit.</p>
            </div>
            <div className="form-grid">
              <Field label="Academic term" required>
                <select
                  value={data.term}
                  onChange={(e) =>
                    set("term", e.target.value as LoadRevisionPermit["term"])
                  }
                >
                  <option>1st Semester</option>
                  <option>2nd Semester</option>
                  <option>Summer Term</option>
                </select>
              </Field>
              <Field label="School year" required>
                <input
                  value={data.schoolYear}
                  onChange={(e) => set("schoolYear", e.target.value)}
                  placeholder="e.g. 2025–2026"
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="form-section">
          <div className="section-number">2</div>
          <div className="section-body">
            <div className="section-title">
              <h3>Student information</h3>
              <p>
                Enter your name in Family, Given, Middle order as shown on the
                permit.
              </p>
            </div>
            <div className="form-grid three-col">
              <Field label="Family name" required>
                <input
                  value={data.familyName}
                  onChange={(e) => set("familyName", e.target.value)}
                />
              </Field>
              <Field label="Given name" required>
                <input
                  value={data.givenName}
                  onChange={(e) => set("givenName", e.target.value)}
                />
              </Field>
              <Field label="Middle name">
                <input
                  value={data.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                />
              </Field>
              <Field label="Student ID number" required>
                <input
                  value={data.studentId}
                  onChange={(e) => set("studentId", e.target.value)}
                />
              </Field>
              <Field label="Date" required>
                <input
                  type="date"
                  value={data.permitDate}
                  onChange={(e) => set("permitDate", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="form-section">
          <div className="section-number">3</div>
          <div className="section-body">
            <div className="section-title">
              <h3>Academic information</h3>
              <p>
                College, department, and course/year come from your student
                profile. Enter the professor handling the subject; registered
                accounts appear in the search list. Dean and chairperson names
                fill only from your saved college and department.
              </p>
            </div>
            <div className="form-grid">
              <Field label="College / School" required>
                <input value={data.college} readOnly aria-readonly="true" />
              </Field>
              <Field label="Department" required>
                <input value={data.department} readOnly aria-readonly="true" />
              </Field>
              <Field label="Course and year" required>
                <input value={data.courseYear} readOnly aria-readonly="true" />
              </Field>
              <Field label="Professor / instructor" required>
                <ProfessorPicker
                  value={data.professor}
                  userId={data.professorUserId}
                  options={academicOptions?.professors ?? []}
                  onChange={(name, userId) =>
                    setData((current) => ({
                      ...current,
                      professor: name,
                      professorUserId: userId,
                    }))
                  }
                />
                {professorOptionsError && (
                  <small className="professor-status unregistered">
                    {professorOptionsError}
                  </small>
                )}
              </Field>
              <Field label="College dean">
                <input value={data.collegeDean} readOnly aria-readonly="true" />
              </Field>
              <Field label="Department chairperson">
                <input
                  value={data.departmentChairperson}
                  readOnly
                  aria-readonly="true"
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="form-section">
          <div className="section-number">4</div>
          <div className="section-body">
            <SubjectEditor
              kind="withdraw"
              rows={data.withdraw}
              update={(rows) => set("withdraw", rows)}
            />
          </div>
        </section>
        <section className="form-section">
          <div className="section-number">5</div>
          <div className="section-body">
            <SubjectEditor
              kind="add"
              rows={data.add}
              update={(rows) => set("add", rows)}
            />
          </div>
        </section>
        <section className="form-section">
          <div className="section-number">6</div>
          <div className="section-body">
            <div className="section-title">
              <h3>Academic load</h3>
              <p>
                Enter both units and hours per week before and after revision.
              </p>
            </div>
            <div className="form-grid four-col">
              <Field label="Before — units" required>
                <input
                  type="number"
                  value={data.loadBeforeUnits}
                  onChange={(e) => set("loadBeforeUnits", e.target.value)}
                />
              </Field>
              <Field label="Before — hours/week" required>
                <input
                  type="number"
                  value={data.loadBeforeHours}
                  onChange={(e) => set("loadBeforeHours", e.target.value)}
                />
              </Field>
              <Field label="After — units" required>
                <input
                  type="number"
                  value={data.loadAfterUnits}
                  onChange={(e) => set("loadAfterUnits", e.target.value)}
                />
              </Field>
              <Field label="After — hours/week" required>
                <input
                  type="number"
                  value={data.loadAfterHours}
                  onChange={(e) => set("loadAfterHours", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="form-section">
          <div className="section-number">7</div>
          <div className="section-body">
            <div className="section-title">
              <h3>Reason for load revision</h3>
              <p>
                Select all applicable reasons and provide your printed name for
                the student signature area.
              </p>
            </div>
            <div className="reason-checks">
              <label>
                <input
                  type="checkbox"
                  checked={data.conflict}
                  onChange={(e) => set("conflict", e.target.checked)}
                />{" "}
                Conflict of Schedule
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={data.dissolved}
                  onChange={(e) => set("dissolved", e.target.checked)}
                />{" "}
                Subject/s Dissolved
              </label>
            </div>
            <Field label="Other reason/s">
              <textarea
                rows={3}
                value={data.otherReason}
                onChange={(e) => set("otherReason", e.target.value)}
                placeholder="Enter other reason/s, if applicable"
              />
            </Field>
            <Field label="Student signature over printed name" required>
              <input
                value={data.studentSignature}
                onChange={(e) => set("studentSignature", e.target.value)}
              />
            </Field>
          </div>
        </section>
        <section className="form-section approval-readonly">
          <div className="section-number">8</div>
          <div className="section-body">
            <div className="section-title">
              <h3>Approval routing</h3>
              <p>
                The professor is the name you entered or selected above. The
                remaining approvers are assigned by the university workflow
                after you submit.
              </p>
            </div>
            <div className="approval-slots">
              {approvalRoles.map((role) => (
                <div key={role.key}>
                  <Icon name="pen" size={16} />
                  <strong>{role.label}</strong>
                  <span className="auto-value">
                    {approverLabel(role.key) ??
                      "Backend-assigned after submission"}
                  </span>
                  <em>{role.step}</em>
                </div>
              ))}
            </div>
            <div className="official-fields">
              <span>Assessment</span>
              <b>University personnel only</b>
              <span>Official Receipt No.</span>
              <b>University personnel only</b>
            </div>
          </div>
        </section>
        {error && (
          <div className="form-error-banner">
            <Icon name="x" size={17} />
            {error}
          </div>
        )}
        <div className="form-actions">
          <Button variant="secondary" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!profileStatus.complete}>
            Review and submit <Icon name="arrow" size={16} />
          </Button>
        </div>
      </form>
      {confirm && (
        <Modal
          title={
            isResubmission
              ? "Resubmit this official permit?"
              : "Submit this official permit?"
          }
          close={() => setConfirm(false)}
        >
          <div className="confirm-icon">
            <Icon name="file" />
          </div>
          <p>
            {isResubmission
              ? "You're about to resubmit your revised "
              : "You're about to submit the "}
            <strong>Academic Load Revision Permit</strong>{" "}
            (FM-MSU-IIT-RGTR-008). Designated university personnel will complete
            the approval and signature fields.
          </p>
          <div className="modal-summary">
            <span>Student</span>
            <strong>
              {data.familyName}, {data.givenName} {data.middleName}
            </strong>
            <span>Term</span>
            <strong>
              {data.term}, SY {data.schoolYear}
            </strong>
            <span>College / department</span>
            <strong>
              {data.college || "Not provided"} ·{" "}
              {data.department || "Not provided"}
            </strong>
            {approvalRoles.map((role) => (
              <Fragment key={role.key}>
                <span>{role.label}</span>
                <strong>
                  {approverLabel(role.key) ??
                    "Backend-assigned after submission"}
                </strong>
              </Fragment>
            ))}
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Go back
            </Button>
            <Button onClick={() => submit(data)}>
              {isResubmission ? "Confirm resubmission" : "Confirm submission"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
