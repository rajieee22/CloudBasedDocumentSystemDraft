import { useEffect, useState, type FormEvent } from "react"

import { Button, Field, Info } from "../../components/ui"
import type { AuthenticatedUser } from "../../lib/auth"
import {
  getAcademicOptionsApi,
  updateStudentProfileApi,
  type AcademicOptions,
  type SignatoryOption,
} from "../../lib/studentProfile"

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatSignatory(signatory: SignatoryOption) {
  return [signatory.name, signatory.positionTitle].filter(Boolean).join(" · ")
}

export function SettingsPage({
  user,
  onProfileUpdated,
}: {
  user: AuthenticatedUser
  onProfileUpdated: (user: AuthenticatedUser) => void
}) {
  const isStudent = user.roles.includes("STUDENT")
  const displayName = [user.givenName, user.middleName, user.familyName]
    .filter(Boolean)
    .join(" ")
  const roles = user.roles.map(formatRole).join(", ") || "No assigned role"
  const missing = "Not provided"

  const [options, setOptions] = useState<AcademicOptions | null>(null)
  const [loading, setLoading] = useState(isStudent)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [college, setCollege] = useState("")
  const [department, setDepartment] = useState("")
  const [course, setCourse] = useState("")
  const [collegeDean, setCollegeDean] = useState<SignatoryOption | null>(null)
  const [chairperson, setChairperson] = useState<SignatoryOption | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isStudent) return

    let active = true

    async function loadOptions() {
      try {
        const result = await getAcademicOptionsApi()

        if (active) {
          setOptions(result)
        }
      } catch (loadFailure) {
        if (active) {
          setLoadError(
            loadFailure instanceof Error
              ? loadFailure.message
              : "Unable to load academic options.",
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOptions()

    return () => {
      active = false
    }
  }, [isStudent])

  useEffect(() => {
    if (!isStudent || !options) return

    setCollege(user.college ?? "")
    setDepartment(user.department ?? "")
    setCourse(user.program ?? "")
    setCollegeDean(
      options.deans.find(
        (option) =>
          option.college === user.college &&
          option.signatory.userId === user.collegeDeanUserId,
      )?.signatory ?? null,
    )
    setChairperson(
      options.departments.find(
        (option) =>
          option.college === user.college &&
          option.name === user.department &&
          option.chairperson?.userId === user.departmentChairpersonUserId,
      )?.chairperson ?? null,
    )
  }, [
    isStudent,
    options,
    user.college,
    user.department,
    user.program,
    user.collegeDeanUserId,
    user.departmentChairpersonUserId,
  ])

  function selectCollege(value: string) {
    setCollege(value)
    setDepartment("")
    setCourse("")
    setCollegeDean(
      options?.deans.find((option) => option.college === value)?.signatory ??
        null,
    )
    setChairperson(null)
    setError(null)
    setSaved(false)
  }

  function selectDepartment(value: string) {
    setDepartment(value)
    setCourse("")
    setChairperson(
      options?.departments.find(
        (option) => option.college === college && option.name === value,
      )?.chairperson ?? null,
    )
    setError(null)
    setSaved(false)
  }

  function selectCourse(value: string) {
    setCourse(value)
    setError(null)
    setSaved(false)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!collegeDean || !chairperson) {
      setError("Select a college and department with registered signatories.")
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const updated = await updateStudentProfileApi({
        college,
        department,
        course,
        collegeDeanUserId: collegeDean.userId,
        departmentChairpersonUserId: chairperson.userId,
      })

      onProfileUpdated(updated)
      setSaved(true)
    } catch (saveFailure) {
      setError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "Unable to update student information.",
      )
    } finally {
      setSaving(false)
    }
  }

  const departments =
    options?.departments.filter((option) => option.college === college) ?? []

  const courses =
    options?.courses.filter(
      (option) =>
        option.college === college && option.department === department,
    ) ?? []

  return (
    <div className="settings-layout">
      <section className="card settings-profile">
        <div className="avatar large">
          {user.givenName.charAt(0)}
          {user.familyName.charAt(0)}
        </div>
        <h2>{displayName}</h2>
        <p>{user.email}</p>
        <span className="settings-role">{roles}</span>
      </section>

      <div className="settings-details">
        <section className="card settings-card">
          <div className="card-head">
            <div>
              <h3>
                {isStudent ? "Academic information" : "Office information"}
              </h3>
              <p>
                {isStudent
                  ? "Complete and update the academic details used for document routing."
                  : "Details recorded for your university account."}
              </p>
            </div>
          </div>

          {!isStudent && (
            <div className="info-grid">
              <Info label="Email" value={user.email} />
              <Info label="Affiliation" value="MSU–IIT" />
            </div>
          )}

          {isStudent && loading && (
            <p className="settings-note">Loading academic options...</p>
          )}

          {isStudent && loadError && (
            <p className="field-error-text">{loadError}</p>
          )}

          {isStudent && options && (
            <form className="settings-form" onSubmit={saveProfile}>
              <div className="form-grid">
                <Field label="Student number" required>
                  <input value={user.studentNumber ?? ""} readOnly />
                </Field>

                <Field label="Year level" required>
                  <input value={user.yearLevel?.toString() ?? ""} readOnly />
                </Field>

                <Field label="College / school" required>
                  <select
                    value={college}
                    onChange={(event) => selectCollege(event.target.value)}
                  >
                    <option value="">Select college</option>
                    {options.colleges.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <small className="field-hint">
                    Current: {user.college || missing}
                  </small>
                </Field>

                <Field label="College Dean" required>
                  <input
                    value={collegeDean ? formatSignatory(collegeDean) : ""}
                    readOnly
                    placeholder="Select a college first"
                  />
                  {collegeDean && (
                    <small className="field-hint">
                      Registered account: {collegeDean.email}
                    </small>
                  )}
                </Field>

                <Field label="Department" required>
                  <select
                    value={department}
                    disabled={!college}
                    onChange={(event) => selectDepartment(event.target.value)}
                  >
                    <option value="">Select department</option>
                    {departments.map((option) => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <small className="field-hint">
                    Current: {user.department || missing}
                  </small>
                </Field>

                <Field label="Department Chairperson" required>
                  <input
                    value={chairperson ? formatSignatory(chairperson) : ""}
                    readOnly
                    placeholder="Select a department first"
                  />
                  {chairperson && (
                    <small className="field-hint">
                      Registered account: {chairperson.email}
                    </small>
                  )}
                </Field>

                <Field label="Course / program" required>
                  <select
                    value={course}
                    disabled={!department}
                    onChange={(event) => selectCourse(event.target.value)}
                  >
                    <option value="">Select course</option>
                    {courses.map((option) => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <small className="field-hint">
                    Current: {user.program || missing}
                  </small>
                </Field>
              </div>

              <p className="settings-note">
                College Dean and Department Chairperson are filled automatically
                from the registered signatory accounts for your selections.
              </p>

              {error && <p className="field-error-text">{error}</p>}
              {saved && (
                <p className="field-success-text">
                  Student information updated.
                </p>
              )}

              <div className="form-actions">
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !college ||
                    !department ||
                    !course ||
                    !collegeDean ||
                    !chairperson
                  }
                >
                  {saving ? "Saving..." : "Save information"}
                </Button>
              </div>
            </form>
          )}
        </section>

        <section className="card settings-card">
          <div className="card-head">
            <div>
              <h3>Account details</h3>
              <p>Your sign-in and affiliation information.</p>
            </div>
          </div>
          <div className="info-grid">
            <Info label="University email" value={user.email} />
            <Info label="University affiliation" value="MSU–IIT" />
            <Info label="Account role" value={roles} />
          </div>
        </section>

        {!isStudent && (
          <p className="settings-note">
            To correct any of these details, contact ICTC support.
          </p>
        )}
      </div>
    </div>
  )
}
