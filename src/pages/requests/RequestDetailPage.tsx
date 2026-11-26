import { useEffect, useState } from "react";
import type { RequestItem, Role, LoadRevisionPermit } from "../../types";
import { Button, Icon, Info, StatusBadge } from "../../components/ui";
import { ApprovalTracker } from "../../components/requests/ApprovalTracker";
import { mapLoadRevisionToPermit } from "../../lib/permit";
import {
  getRequestDetailsApi,
  type RequestDetail,
  type LoadRevisionDetails,
  type ShifterApplicationDetails,
  type LeaveOfAbsenceDetails,
} from "../../lib/requests";

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function LoadRevisionInformation({
  details,
}: {
  details: LoadRevisionDetails;
}) {
  return (
    <>
      <section className="card info-card">
        <div className="card-head">
          <div>
            <h3>Academic information</h3>
            <p>Information submitted with the permit.</p>
          </div>
        </div>

        <div className="info-grid">
          <Info label="Academic term" value={details.academic_term} />
          <Info label="School year" value={details.school_year} />
          <Info label="College" value={details.college} />
          <Info label="Department" value={details.department} />
          <Info label="Course / Year" value={details.course_year} />
          <Info label="Permit date" value={details.permit_date} />
        </div>
      </section>

      <section className="card info-card">
        <div className="card-head">
          <div>
            <h3>Academic load</h3>
            <p>Load before and after the requested revision.</p>
          </div>
        </div>

        <div className="info-grid">
          <Info
            label="Load before (units)"
            value={formatValue(details.load_before_units)}
          />
          <Info
            label="Load before (hours)"
            value={formatValue(details.load_before_hours)}
          />
          <Info
            label="Load after (units)"
            value={formatValue(details.load_after_units)}
          />
          <Info
            label="Load after (hours)"
            value={formatValue(details.load_after_hours)}
          />
          <Info
            label="Conflict of schedule"
            value={formatValue(details.conflict_of_schedule)}
          />
          <Info
            label="Subjects dissolved"
            value={formatValue(details.subjects_dissolved)}
          />
        </div>

        {details.other_reason && (
          <div className="reason-box">
            <span>Reason for request</span>
            <p>{details.other_reason}</p>
          </div>
        )}
      </section>

      <section className="card info-card">
        <div className="card-head">
          <div>
            <h3>Subjects to withdraw</h3>
            <p>Subjects included in the withdrawal request.</p>
          </div>
        </div>

        {details.subjects.filter(
          (subject) => subject.revision_action === "WITHDRAW",
        ).length === 0 ? (
          <p className="small">No subjects submitted for withdrawal.</p>
        ) : (
          <div className="table-wrap">
            <table className="request-subject-table">
              <thead>
                <tr>
                  <th>Course / Section</th>
                  <th>Subject title</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {details.subjects
                  .filter((subject) => subject.revision_action === "WITHDRAW")
                  .map((subject) => (
                    <tr key={subject.subject_id}>
                      <td>{subject.course_number_section}</td>
                      <td>{subject.course_title}</td>
                      <td>{subject.units}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card info-card">
        <div className="card-head">
          <div>
            <h3>Subjects to add</h3>
            <p>Subjects included in the addition request.</p>
          </div>
        </div>

        {details.subjects.filter((subject) => subject.revision_action === "ADD")
          .length === 0 ? (
          <p className="small">No subjects submitted for addition.</p>
        ) : (
          <div className="table-wrap">
            <table className="request-subject-table">
              <thead>
                <tr>
                  <th>Course / Section</th>
                  <th>Subject title</th>
                  <th>Units</th>
                  <th>Closed subject</th>
                </tr>
              </thead>
              <tbody>
                {details.subjects
                  .filter((subject) => subject.revision_action === "ADD")
                  .map((subject) => (
                    <tr key={subject.subject_id}>
                      <td>{subject.course_number_section}</td>
                      <td>{subject.course_title}</td>
                      <td>{subject.units}</td>
                      <td>{subject.is_closed_subject ? "Yes" : "No"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function ShifterInformation({
  details,
}: {
  details: ShifterApplicationDetails;
}) {
  return (
    <section className="card info-card">
      <div className="card-head">
        <div>
          <h3>Shifter's application information</h3>
          <p>Program information submitted by the student.</p>
        </div>
      </div>

      <div className="info-grid">
        <Info label="Current program" value={details.current_program} />
        <Info label="Intended program" value={details.intended_program} />
      </div>

      <div className="reason-box">
        <span>Reason for shifting</span>
        <p>{details.reason_for_shifting || "No reason provided."}</p>
      </div>
    </section>
  );
}

function LeaveInformation({ details }: { details: LeaveOfAbsenceDetails }) {
  return (
    <section className="card info-card">
      <div className="card-head">
        <div>
          <h3>Leave of absence information</h3>
          <p>Details submitted with the leave application.</p>
        </div>
      </div>

      <div className="info-grid">
        <Info label="Academic year" value={details.current_academic_year} />
        <Info label="Semester" value={details.semester} />
      </div>

      <div className="reason-box">
        <span>Reason for absence</span>
        <p>{details.reason_of_absence || "No reason provided."}</p>
      </div>
    </section>
  );
}

export function Detail({
  request,
  role,
  back,
  review,
  editRevision,
}: {
  request: RequestItem;
  role: Role;
  back: () => void;
  review?: () => void;
  editRevision?: (
    data:
      | LoadRevisionPermit
      | ShifterApplicationDetails
      | LeaveOfAbsenceDetails,
    documentCode: string,
  ) => void;
}) {
  const [details, setDetails] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setLoading(true);
      setError("");
      setDetails(null);

      try {
        const result = await getRequestDetailsApi(request.id);

        if (!cancelled) {
          setDetails(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load request details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [request.id]);

  return (
    <>
      <button className="back-link" onClick={back}>
        ← Back to requests
      </button>

      <div className="detail-head">
        <div>
          <div className="detail-title">
            <span className="doc-big">
              <Icon name="file" />
            </span>

            <div>
              <span>{request.id}</span>
              <h2>{request.type}</h2>
              <p>Submitted by {request.student}</p>
            </div>
          </div>
        </div>

        <div className="detail-actions">
          <StatusBadge status={request.status} />

          {role === "student" &&
            request.status === "Returned for Revision" &&
            details &&
            ["LOAD_REVISION", "SHIFT_APPLICATION", "LEAVE_ABSENCE"].includes(
              details.documentCode,
            ) &&
            editRevision && (
              <Button
                onClick={() => {
                  if (!details.details || !editRevision) return;

                  if (details.documentCode === "LOAD_REVISION") {
                    editRevision(
                      mapLoadRevisionToPermit(
                        details.details as LoadRevisionDetails,
                        details.student,
                      ),
                      details.documentCode,
                    );
                  } else if (details.documentCode === "SHIFT_APPLICATION") {
                    editRevision(
                      details.details as ShifterApplicationDetails,
                      details.documentCode,
                    );
                  } else if (details.documentCode === "LEAVE_ABSENCE") {
                    editRevision(
                      details.details as LeaveOfAbsenceDetails,
                      details.documentCode,
                    );
                  }
                }}
              >
                Edit and Resubmit
              </Button>
            )}

          {request.status === "Completed" && (
            <Button icon="download" disabled>
              PDF unavailable
            </Button>
          )}

          {role === "approver" && request.status === "Pending" && (
            <Button onClick={review}>Review request</Button>
          )}
        </div>
      </div>

      {loading && (
        <section className="card">
          <p>Loading request details...</p>
        </section>
      )}

      {error && (
        <section className="card">
          <h3>Unable to load request</h3>
          <p>{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              setLoading(true);
              getRequestDetailsApi(request.id)
                .then(setDetails)
                .catch((err) =>
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load request details.",
                  ),
                )
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </Button>
        </section>
      )}

      {!loading && !error && details && (
        <>
          <div className="detail-grid">
            <div>
              <section className="card info-card">
                <div className="card-head">
                  <div>
                    <h3>Student information</h3>
                    <p>Account and student profile information.</p>
                  </div>
                </div>

                <div className="info-grid">
                  <Info
                    label="Student ID"
                    value={details.student.studentNumber ?? "Not available"}
                  />
                  <Info label="Full name" value={details.student.fullName} />
                  <Info label="Email" value={details.student.email} />
                  <Info
                    label="College"
                    value={details.student.college ?? "Not available"}
                  />
                  <Info
                    label="Department"
                    value={details.student.department ?? "Not available"}
                  />
                  <Info
                    label="Program"
                    value={details.student.program ?? "Not available"}
                  />
                  <Info
                    label="Year level"
                    value={formatValue(details.student.yearLevel)}
                  />
                </div>
              </section>

              {details.documentCode === "LOAD_REVISION" && details.details && (
                <LoadRevisionInformation
                  details={details.details as LoadRevisionDetails}
                />
              )}

              {details.documentCode === "SHIFT_APPLICATION" &&
                details.details && (
                  <ShifterInformation
                    details={details.details as ShifterApplicationDetails}
                  />
                )}

              {details.documentCode === "LEAVE_ABSENCE" && details.details && (
                <LeaveInformation
                  details={details.details as LeaveOfAbsenceDetails}
                />
              )}

              <section className="card history-card">
                <div className="card-head">
                  <div>
                    <h3>Submission information</h3>
                    <p>Recorded information from the database.</p>
                  </div>
                </div>

                <div className="info-grid">
                  <Info
                    label="Reference number"
                    value={details.referenceNumber}
                  />
                  <Info label="Document type" value={details.documentName} />
                  <Info label="Current status" value={details.status} />
                  <Info
                    label="Submitted"
                    value={formatDate(details.submittedAt)}
                  />
                  <Info
                    label="Completed"
                    value={formatDate(details.completedAt)}
                  />
                </div>
              </section>
            </div>

            <ApprovalTracker progress={details.workflowProgress} />
          </div>
        </>
      )}
    </>
  );
}
