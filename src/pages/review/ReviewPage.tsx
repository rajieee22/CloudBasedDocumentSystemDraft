import { useEffect, useState } from "react"

import type { LoadRevisionPermit, RequestItem, Status } from "../../types"

import {
  Button,
  Icon,
  Info,
  Modal,
  PermitSignature,
  StatusBadge,
} from "../../components/ui"

import { isLoadRevision } from "../../data/initialData"
import { ApprovalTracker } from "../../components/requests/ApprovalTracker"
import { mapLoadRevisionToPermit } from "../../lib/permit"

import {
  getRequestDetailsApi,
  type ApprovalHistoryItem,
  type LoadRevisionDetails,
  type ShifterApplicationDetails,
  type LeaveOfAbsenceDetails,
} from "../../lib/requests"

export function GenericReviewPage({
  request,
  finish,
  back,
}: {
  request: RequestItem
  finish: (action: Status, reason?: string) => void
  back: () => void
}) {
  const [dialog, setDialog] = useState<"approve" | "reject" | "return" | null>(
    null,
  )

  const [comment, setComment] = useState("")

  // Approval history state
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>(
    [],
  )

  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [studentInfo, setStudentInfo] =
    useState<Awaited<ReturnType<typeof getRequestDetailsApi>>["student"] | null>(
      null,
    )

  const [requestDetails, setRequestDetails] =
    useState<Awaited<ReturnType<typeof getRequestDetailsApi>> | null>(null)

  // Fetch approval history for the selected request.
  useEffect(() => {
    let cancelled = false

    async function loadApprovalHistory() {
      setHistoryLoading(true)
      setHistoryError(false)

      try {
        const requestDetails = await getRequestDetailsApi(request.id)

        if (!cancelled) {
          setApprovalHistory(requestDetails.approvalHistory ?? [])
          setStudentInfo(requestDetails.student)
          setRequestDetails(requestDetails)
        }
      } catch (error) {
        console.error("Unable to load approval history:", error)

        if (!cancelled) {
          setApprovalHistory([])
          setHistoryError(true)
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    loadApprovalHistory()

    return () => {
      cancelled = true
    }
  }, [request.id])

  // Only show actual approval events.
  const approvedEntries = approvalHistory.filter(
    (entry) => entry.action === "Approved",
  )

  // The API returns history in chronological order.
  const previousApproval =
    approvedEntries.length > 0
      ? approvedEntries[approvedEntries.length - 1]
      : null

  // Generate initials from the approver's name.
  const approvalInitials = previousApproval?.actorName
    ? previousApproval.actorName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  // Format the approval date.
  const approvalDate = previousApproval?.createdAt
    ? new Date(previousApproval.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  const submittedReason =
    requestDetails?.documentCode === "SHIFT_APPLICATION" &&
    requestDetails.details
      ? (requestDetails.details as ShifterApplicationDetails)
          .reason_for_shifting
      : requestDetails?.documentCode === "LEAVE_ABSENCE" &&
          requestDetails.details
        ? (requestDetails.details as LeaveOfAbsenceDetails).reason_of_absence
        : requestDetails?.documentCode === "LOAD_REVISION" &&
            requestDetails.details
          ? (requestDetails.details as LoadRevisionDetails).other_reason
          : ""

  return (
    <>
      <button className="back-link" onClick={back}>
        ← Back to approval queue
      </button>

      <div className="review-top">
        <div>
          <span>{request.id}</span>
          <h2>{request.type}</h2>
          <p>
            Submitted by {request.student} · {request.date}
          </p>
        </div>

        <StatusBadge status="Pending" />
      </div>

      <div className="review-grid">
        <section className="document-preview">
          <div className="preview-bar">
            <span>Document preview</span>

            <div>
              <button>−</button>
              <b>100%</b>
              <button>+</button>

              <button>
                <Icon name="download" size={16} />
              </button>
            </div>
          </div>

          <div className="paper">
            <div className="paper-brand">
              <div className="mini-seal">
                MSU
                <br />
                IIT
              </div>

              <div>
                <strong>Mindanao State University</strong>
                <span>Iligan Institute of Technology</span>
                <small>OFFICE OF THE UNIVERSITY REGISTRAR</small>
              </div>
            </div>

            <hr />

            <h3>{request.type.toUpperCase()}</h3>

            <div className="paper-row">
              <span>Student Name</span>
              <b>{studentInfo?.fullName ?? "—"}</b>
              <span>Student ID</span>
              <b>{studentInfo?.studentNumber ?? "—"}</b>
            </div>

            <div className="paper-row">
              <span>Program</span>
              <b>{studentInfo?.program ?? "—"}</b>
              <span>Year Level</span>
              <b>
                {studentInfo?.yearLevel
                  ? `${studentInfo.yearLevel}${
                      Number(studentInfo.yearLevel) === 1
                        ? "st"
                        : Number(studentInfo.yearLevel) === 2
                          ? "nd"
                          : Number(studentInfo.yearLevel) === 3
                            ? "rd"
                            : "th"
                    } Year`
                  : "—"}
              </b>
            </div>

            <div className="paper-block">
              <span>Reason for request</span>
              <p>
                {submittedReason || "No reason was provided with this request."}
              </p>
            </div>

            <div className="signature-lines">
              <div>
                <i />
                <span>Student signature</span>
              </div>

              <div>
                <i />
                <span>Program Adviser</span>
              </div>

              <div>
                <i />
                <span>Department Chair</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="review-panel">
          <div className="review-tabs">
            <button className="active">Details</button>
            <button>History</button>
          </div>

          <div className="review-section">
            <h3>Student information</h3>

            <Info
              label="Student ID"
              value={studentInfo?.studentNumber ?? "—"}
            />
            <Info label="Email" value={studentInfo?.email ?? "—"} />
            <Info label="Program" value={studentInfo?.program ?? "—"} />

            <Button variant="ghost" icon="mail">
              Contact student
            </Button>
          </div>

          {/* Dynamic previous approval */}
          <div className="review-section">
            <h3>Previous approval</h3>

            {historyLoading ? (
              <p>Loading approval history...</p>
            ) : historyError ? (
              <p>
                Unable to load approval history. Please refresh or try again.
              </p>
            ) : previousApproval ? (
              <div className="previous">
                <span className="avatar tiny dark">{approvalInitials}</span>

                <div>
                  <strong>
                    {previousApproval.actorName || "Unknown approver"}
                  </strong>

                  <small>
                    {previousApproval.actorRole || "Approver"}
                    {" · "}
                    Approved {approvalDate}
                  </small>

                  <p>{previousApproval.remarks || "No remarks provided."}</p>
                </div>
              </div>
            ) : (
              <p>No previous approvals yet.</p>
            )}
          </div>

          <ApprovalTracker
            progress={requestDetails?.workflowProgress ?? null}
            compact
          />

          <div className="action-box">
            <span className="eyebrow">Your decision</span>

            <p>Review all submitted information before taking action.</p>

            <Button
              variant="success"
              icon="check"
              onClick={() => setDialog("approve")}
            >
              Approve
            </Button>

            <div>
              <Button variant="secondary" onClick={() => setDialog("return")}>
                Return for revision
              </Button>

              <Button variant="danger" onClick={() => setDialog("reject")}>
                Reject
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {dialog && (
        <Modal
          title={
            dialog === "approve"
              ? "Approve this document?"
              : dialog === "reject"
                ? "Reject this request?"
                : "Return for revision?"
          }
          close={() => setDialog(null)}
        >
          <div className={`confirm-icon ${dialog}`}>
            <Icon
              name={
                dialog === "approve"
                  ? "check"
                  : dialog === "reject"
                    ? "x"
                    : "rotate"
              }
            />
          </div>

          <p>
            {dialog === "approve"
              ? "Your approval will be recorded for the current workflow step and the backend will advance the document."
              : "Provide a clear reason. The student will receive this message with the status update."}
          </p>

          {dialog !== "approve" && (
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                dialog === "reject"
                  ? "Reason for rejection…"
                  : "What should the student revise?"
              }
            />
          )}

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>

            <Button
              variant={
                dialog === "approve"
                  ? "success"
                  : dialog === "reject"
                    ? "danger"
                    : "primary"
              }
              disabled={dialog !== "approve" && !comment.trim()}
              onClick={() =>
                finish(
                  dialog === "approve"
                    ? "Approved"
                    : dialog === "reject"
                      ? "Rejected"
                      : "Returned for Revision",
                  comment,
                )
              }
            >
              {dialog === "approve" ? "Approve document" : "Confirm decision"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export function OfficialPermitPreview({
  permit,
}: {
  permit: LoadRevisionPermit
}) {
  const fullName =
    `${permit.familyName}, ${permit.givenName} ${permit.middleName}`.trim()

  return (
    <div className="official-paper">
      <div className="official-header">
        <div className="official-mark">
          MSU
          <br />
          IIT
        </div>

        <div>
          <strong>ILIGAN INSTITUTE OF TECHNOLOGY</strong>
          <span>MINDANAO STATE UNIVERSITY</span>
        </div>

        <div className="document-meta">
          <span>OFFICE OF THE REGISTRAR</span>
          <b>Document Code No.</b>
          <strong>FM-MSU-IIT-RGTR-008</strong>
          <small>Revision No. 00 · Effective 02.20.2020 · Page 1 of 1</small>
        </div>
      </div>

      <h3>ACADEMIC LOAD REVISION PERMIT</h3>

      <div className="permit-part">
        <b>PART 1</b>

        <div className="permit-term">
          <span>{permit.term === "1st Semester" ? "☒" : "☐"} 1ST Semester</span>
          <span>{permit.term === "2nd Semester" ? "☒" : "☐"} 2ND Semester</span>
          <span>{permit.term === "Summer Term" ? "☒" : "☐"} Summer Term</span>
          <strong>School Year: {permit.schoolYear}</strong>
        </div>
      </div>

      <div className="permit-part">
        <b>PART 2</b>

        <div className="permit-columns">
          <div>
            <small>FULL NAME (Family, Given, Middle)</small>
            <strong>{fullName}</strong>
          </div>

          <div>
            <small>I.D. No.</small>
            <strong>{permit.studentId}</strong>
          </div>

          <div>
            <small>Date</small>
            <strong>{permit.permitDate}</strong>
          </div>
        </div>
      </div>

      <div className="permit-part">
        <b>PART 3</b>

        <div className="permit-columns">
          <div>
            <small>COLLEGE / SCHOOL</small>
            <strong>{permit.college}</strong>
          </div>

          <div>
            <small>DEPARTMENT</small>
            <strong>{permit.department}</strong>
          </div>

          <div>
            <small>COURSE & YEAR</small>
            <strong>{permit.courseYear}</strong>
          </div>
        </div>

        <div className="permit-columns permit-signatories">
          <div>
            <small>PROFESSOR</small>
            <strong>{permit.professor || "—"}</strong>
          </div>

          <div>
            <small>DEPARTMENT CHAIRPERSON</small>
            <strong>{permit.departmentChairperson || "—"}</strong>
          </div>

          <div>
            <small>COLLEGE DEAN</small>
            <strong>{permit.collegeDean || "—"}</strong>
          </div>
        </div>
      </div>

      <div className="permit-part subject-part">
        <b>PART 4</b>

        <div>
          <h4>WITHDRAW from the following subject/s:</h4>

          <div className="permit-subject-head">
            <span>COURSE NO. & SEC.</span>
            <span>COURSE TITLE</span>
            <span>UNITS</span>
            <span>CONTROLLER</span>
            <span>PROFESSOR</span>
          </div>

          {permit.withdraw.map((row, index) => (
            <div className="permit-subject-row" key={`withdraw-${index}`}>
              <strong>{row.course || "—"}</strong>
              <strong>{row.title || "—"}</strong>
              <strong>{row.units || "—"}</strong>

              <PermitSignature
                label="Signature over Printed Name"
                value={permit.signatures[`Withdraw Controller ${index + 1}`]}
              />

              <PermitSignature
                label="Signature over Printed Name"
                value={permit.signatures[`Withdraw Professor ${index + 1}`]}
              />
            </div>
          ))}

          <p className="permit-note">
            Note: WITHDRAW FROM ALL SUBJECTS. Attach letter stating reason/s and
            file leave of absence (Form 11) if planning to enroll in the
            Institute within one (1) year.
          </p>
        </div>
      </div>

      <div className="permit-part subject-part">
        <b>PART 5</b>

        <div>
          <h4>ADD the following subject/s:</h4>

          <div className="permit-subject-head add-head">
            <span>NO.</span>
            <span>COURSE NO. & SEC.</span>
            <span>COURSE TITLE</span>
            <span>UNITS</span>
            <span>CONTROLLER</span>
          </div>

          {permit.add.map((row, index) => (
            <div className="permit-subject-row add-row" key={`add-${index}`}>
              <strong>{index + 1}</strong>
              <strong>{row.course || "—"}</strong>
              <strong>{row.title || "—"}</strong>
              <strong>{row.units || "—"}</strong>

              <PermitSignature
                label="Signature over Printed Name"
                value={permit.signatures[`Add Controller ${index + 1}`]}
              />
            </div>
          ))}

          <h5>APPROVAL of Instructor/s for closed subject/s:</h5>

          <div className="closed-approvals">
            {permit.add.map((row, index) => (
              <PermitSignature
                key={`closed-${index}`}
                label={`Subject ${index + 1}${
                  row.closed ? " · Closed" : " · Not applicable"
                }`}
                value={
                  row.closed
                    ? permit.signatures[`Closed Instructor ${index + 1}`]
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="permit-part">
        <b>PART 6</b>

        <div className="load-totals">
          <strong>
            TOTAL LOAD before Revision <u>{permit.loadBeforeUnits}</u> units;{" "}
            <u>{permit.loadBeforeHours}</u> hours/week
          </strong>

          <strong>
            TOTAL LOAD after Revision <u>{permit.loadAfterUnits}</u> units;{" "}
            <u>{permit.loadAfterHours}</u> hours/week
          </strong>
        </div>
      </div>

      <div className="permit-part">
        <b>PART 7</b>

        <div className="permit-reasons">
          <strong>REASON/S for Load Revision</strong>

          <p>
            {permit.conflict ? "☒" : "☐"} Conflict of Schedule &nbsp;&nbsp;{" "}
            {permit.dissolved ? "☒" : "☐"} Subject/s Dissolved &nbsp;&nbsp;
            Other reason/s: <u>{permit.otherReason || "—"}</u>
          </p>

          <PermitSignature
            label="Student's Signature over Printed Name"
            value={permit.studentSignature}
          />
        </div>
      </div>

      <div className="permit-part">
        <b>PART 8</b>

        <div className="permit-approval">
          <strong>APPROVAL:</strong>

          {["Professor", "Adviser", "Chairperson", "Dean", "Registrar"].map(
            (role) => (
              <div className="approval-line" key={role}>
                <b>{role}</b>

                <PermitSignature
                  label="Signature over Printed Name"
                  value={permit.signatures[role]}
                />

                <span>Date: ____________</span>

                {role === "Adviser" && <span>Assessment Php ____________</span>}

                {role === "Chairperson" && <span>O.R. No. ____________</span>}
              </div>
            ),
          )}
        </div>
      </div>

      <p className="copies-note">
        Accomplish in 3 copies – for the Registrar, the Department and the
        Student.
      </p>

      <div className="official-footer">
        <span>A. Bonifacio Avenue, Tibanga, 9200 Iligan City</span>
        <span>Website: www.msuiit.edu.ph</span>
        <span>Registrar: registrar@g.msuiit.edu.ph</span>
      </div>
    </div>
  )
}

export function OfficialReviewPage({
  request,
  finish,
  back,
}: {
  request: RequestItem
  finish: (action: Status, reason?: string, signatureSlot?: string) => void
  back: () => void
}) {
  const [details, setDetails] =
    useState<Awaited<ReturnType<typeof getRequestDetailsApi>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<"approve" | "reject" | "return" | null>(
    null,
  )
  const [comment, setComment] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await getRequestDetailsApi(request.id)

        if (!cancelled) {
          setDetails(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load request details.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [request.id])

  const permit =
    request.permit ??
    (details?.documentCode === "LOAD_REVISION" && details.details
      ? mapLoadRevisionToPermit(
          details.details as LoadRevisionDetails,
          details.student,
        )
      : null)

  return (
    <>
      <button className="back-link" onClick={back}>
        ← Back to approval queue
      </button>

      <div className="review-top">
        <div>
          <span>{request.id} · FM-MSU-IIT-RGTR-008</span>
          <h2>Academic Load Revision Permit</h2>
          <p>
            Submitted by {request.student} · {request.date}
          </p>
        </div>

        <StatusBadge status={request.status} />
      </div>

      {loading && !permit && (
        <section className="card">
          <p>Loading request details...</p>
        </section>
      )}

      {error && !permit && (
        <section className="card">
          <h3>Unable to load request</h3>
          <p>{error}</p>
        </section>
      )}

      {permit && (
        <div className="review-grid">
          <section className="document-preview official-preview">
            <div className="preview-bar">
              <span>Official template preview · Read-only</span>

              <div>
                <b>Fit to page</b>
              </div>
            </div>

            <OfficialPermitPreview permit={permit} />
          </section>

          <aside className="review-panel">
            <div className="review-tabs">
              <button className="active">Details</button>
            </div>

            <div className="review-section">
              <h3>Submitted information</h3>

              <Info label="Student ID" value={permit.studentId} />
              <Info label="Student" value={request.student} />
              <Info
                label="Academic term"
                value={`${permit.term}, SY ${permit.schoolYear}`}
              />
              <Info label="Course and year" value={permit.courseYear} />
            </div>

            <ApprovalTracker
              progress={details?.workflowProgress ?? null}
              compact
            />

            <div className="action-box">
              <span className="eyebrow">Your decision</span>

              <p>
                Approval is recorded against your current workflow step. The
                backend routes the document to the next designated approver.
              </p>

              <Button
                variant="success"
                icon="check"
                onClick={() => setDialog("approve")}
              >
                Approve
              </Button>

              <div>
                <Button variant="secondary" onClick={() => setDialog("return")}>
                  Return for revision
                </Button>

                <Button variant="danger" onClick={() => setDialog("reject")}>
                  Reject
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {dialog && (
        <Modal
          title={
            dialog === "approve"
              ? "Approve this document?"
              : dialog === "reject"
                ? "Reject this request?"
                : "Return for revision?"
          }
          close={() => setDialog(null)}
        >
          <div className={`confirm-icon ${dialog}`}>
            <Icon
              name={
                dialog === "approve"
                  ? "check"
                  : dialog === "reject"
                    ? "x"
                    : "rotate"
              }
            />
          </div>

          <p>
            {dialog === "approve"
              ? "Your approval will be recorded for the current workflow step and the backend will advance the document."
              : "Provide a clear reason. The student will receive this message with the status update."}
          </p>

          {dialog !== "approve" && (
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                dialog === "reject"
                  ? "Reason for rejection…"
                  : "What should the student revise?"
              }
            />
          )}

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>

            <Button
              variant={
                dialog === "approve"
                  ? "success"
                  : dialog === "reject"
                    ? "danger"
                    : "primary"
              }
              disabled={dialog !== "approve" && !comment.trim()}
              onClick={() =>
                finish(
                  dialog === "approve"
                    ? "Approved"
                    : dialog === "reject"
                      ? "Rejected"
                      : "Returned for Revision",
                  comment,
                )
              }
            >
              {dialog === "approve" ? "Approve document" : "Confirm decision"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export function ReviewPage({
  request,
  finish,
  back,
}: {
  request: RequestItem
  finish: (action: Status, reason?: string, signatureSlot?: string) => void
  back: () => void
}) {
  return isLoadRevision(request.type) ? (
    <OfficialReviewPage request={request} finish={finish} back={back} />
  ) : (
    <GenericReviewPage request={request} finish={finish} back={back} />
  )
}
