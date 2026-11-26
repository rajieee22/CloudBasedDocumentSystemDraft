import { useState, type FormEvent } from "react";

import type {
  AuthenticatedUser,
  ShifterApplicationSubmission,
  LeaveOfAbsenceSubmission,
} from "../../lib/auth";
import { getStudentProfileStatus } from "../../lib/studentProfile";

import type {
  ShifterApplicationDetails,
  LeaveOfAbsenceDetails,
} from "../../lib/requests";

import { Button, Field, Icon, Modal } from "../../components/ui";

type GenericRequestSubmission =
  | ShifterApplicationSubmission
  | LeaveOfAbsenceSubmission;

export function GenericRequestForm({
  type,
  cancel,
  submit,
  initialData,
  isResubmission = false,
  studentProfile,
}: {
  type: string;
  cancel: () => void;
  submit: (data?: GenericRequestSubmission) => void;
  initialData?: ShifterApplicationDetails | LeaveOfAbsenceDetails;
  isResubmission?: boolean;
  studentProfile: AuthenticatedUser;
}) {
  const [reason, setReason] = useState(
    initialData
      ? "reason_for_shifting" in initialData
        ? initialData.reason_for_shifting
        : initialData.reason_of_absence
      : "",
  );

  const [intendedProgram, setIntendedProgram] = useState(
    initialData && "intended_program" in initialData
      ? initialData.intended_program
      : "",
  );

  const [currentAcademicYear, setCurrentAcademicYear] = useState(
    initialData && "current_academic_year" in initialData
      ? initialData.current_academic_year
      : "",
  );

  const [semester, setSemester] = useState(
    initialData && "semester" in initialData
      ? initialData.semester
      : "1st Semester",
  );

  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const profileStatus = getStudentProfileStatus(studentProfile);

  const isShifter = type === "Shifter's Application Form";
  const isLeave = type === "Leave of Absence Form";

  function validate(e: FormEvent) {
    e.preventDefault();

    if (!profileStatus.complete) {
      setError(profileStatus.message);
      return;
    }

    if (
      !reason.trim() ||
      (isShifter && !intendedProgram.trim()) ||
      (isLeave && !currentAcademicYear.trim())
    ) {
      setError("Complete all fields marked * before continuing.");
      return;
    }

    setError("");
    setConfirm(true);
  }

  function confirmSubmission() {
    if (isShifter) {
      submit({
        intendedProgram: intendedProgram.trim(),
        reason: reason.trim(),
      });
      return;
    }

    if (isLeave) {
      submit({
        currentAcademicYear: currentAcademicYear.trim(),
        semester,
        reason: reason.trim(),
      });
    }
  }

  return (
    <>
      <div className="form-page-head">
        <button className="back-link" onClick={cancel}>
          ← Back to forms
        </button>

        <span>New request</span>
        <h2>{type}</h2>

        <p>
          Complete the required information below. Fields marked with * are
          required.
        </p>
      </div>

      <form className="request-form" onSubmit={validate}>
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
              <h3>Student information</h3>
              <p>
                These values come from your authenticated student profile. The
                backend uses them for approval routing; they cannot be edited in
                this form.
              </p>
            </div>
            <div className="info-grid">
              <div>
                <span>Student</span>
                <strong>
                  {[studentProfile.givenName, studentProfile.middleName, studentProfile.familyName]
                    .filter(Boolean)
                    .join(" ")}
                </strong>
              </div>
              <div>
                <span>Student number</span>
                <strong>{studentProfile.studentNumber ?? "Not provided"}</strong>
              </div>
              <div>
                <span>College</span>
                <strong>{studentProfile.college ?? "Not provided"}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{studentProfile.department ?? "Not provided"}</strong>
              </div>
              <div>
                <span>Program</span>
                <strong>{studentProfile.program ?? "Not provided"}</strong>
              </div>
              <div>
                <span>Year level</span>
                <strong>{studentProfile.yearLevel ?? "Not provided"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-number">2</div>

          <div className="section-body">
            <div className="section-title">
              <h3>
                {isShifter ? "Program information" : "Academic information"}
              </h3>

              <p>Provide the details relevant to this request.</p>
            </div>

            <div className="form-grid">
              {isShifter && (
                <Field label="Intended program" required>
                  <input
                    type="text"
                    value={intendedProgram}
                    onChange={(e) => {
                      setIntendedProgram(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your intended program"
                    maxLength={120}
                  />
                </Field>
              )}

              {isLeave && (
                <>
                  <Field label="Current academic year" required>
                    <input
                      type="text"
                      value={currentAcademicYear}
                      onChange={(e) => {
                        setCurrentAcademicYear(e.target.value);
                        setError("");
                      }}
                      placeholder="Example: 2026-2027"
                      maxLength={60}
                    />
                  </Field>

                  <Field label="Semester" required>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                    >
                      <option value="1st Semester">First Semester</option>
                      <option value="2nd Semester">Second Semester</option>
                      <option value="Summer Term">Summer Term</option>
                    </select>
                  </Field>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-number">3</div>

          <div className="section-body">
            <div className="section-title">
              <h3>Reason for request</h3>

              <p>
                {isShifter
                  ? "Explain your reason for enrolling in your present program and for shifting."
                  : "Briefly explain the circumstances for your leave of absence."}
              </p>
            </div>

            <Field
              label={
                isLeave
                  ? "Reason for leave of absence"
                  : "Reason for shifting or transferring"
              }
              required
            >
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="Provide a clear explanation to help approvers review your request…"
                rows={5}
                maxLength={5000}
              />

            </Field>
          </div>
        </section>

        {error && (
          <div className="form-error-banner" role="alert">
            <Icon name="x" size={17} />
            <span>{error}</span>
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
            isResubmission ? "Resubmit this request?" : "Submit this request?"
          }
          close={() => setConfirm(false)}
        >
          <div className="confirm-icon">
            <Icon name="file" />
          </div>

          <p>
            You're about to submit your <strong>{type}</strong>. The request
            will be routed to the first designated approver.
          </p>

          <div className="modal-summary">
            <span>Student</span>
            <strong>
              {[studentProfile.givenName, studentProfile.middleName, studentProfile.familyName]
                .filter(Boolean)
                .join(" ")}
            </strong>

            <span>College / department</span>
            <strong>
              {studentProfile.college ?? "Not provided"} ·{" "}
              {studentProfile.department ?? "Not provided"}
            </strong>

            {isShifter && (
              <>
                <span>Intended program</span>
                <strong>{intendedProgram}</strong>
              </>
            )}

            {isLeave && (
              <>
                <span>Academic year</span>
                <strong>{currentAcademicYear}</strong>

                <span>Semester</span>
                <strong>{semester}</strong>
              </>
            )}

            <span>Document</span>
            <strong>{type}</strong>
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Go back
            </Button>

            <Button onClick={confirmSubmission}>
              {isResubmission ? "Confirm resubmission" : "Confirm submission"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
