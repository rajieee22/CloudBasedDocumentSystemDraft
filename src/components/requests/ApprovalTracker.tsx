import { useEffect, useState } from "react";
import {
  getRequestDetailsApi,
  type WorkflowProgress,
} from "../../lib/requests";
import { Icon, Info } from "../ui";

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function workflowMessage(status: string) {
  if (status === "Approved" || status === "Completed") {
    return "All approval steps are complete.";
  }

  if (status === "Rejected") {
    return "This document was rejected by an approver.";
  }

  if (status === "Revision Required") {
    return "This document was returned to the student for revision.";
  }

  return "Waiting for the next assigned approver.";
}

export function ApprovalTracker({
  referenceNumber,
  progress: providedProgress,
  compact = false,
}: {
  referenceNumber?: string;
  progress?: WorkflowProgress | null;
  compact?: boolean;
}) {
  const [fetchedProgress, setFetchedProgress] =
    useState<WorkflowProgress | null>(null);
  const [loading, setLoading] = useState(Boolean(referenceNumber));
  const [error, setError] = useState<string | null>(null);

  const shouldFetch = providedProgress === undefined && Boolean(referenceNumber);

  useEffect(() => {
    if (!shouldFetch || !referenceNumber) return;

    let active = true;

    async function load() {
      try {
        const details = await getRequestDetailsApi(referenceNumber!);

        if (active) {
          setFetchedProgress(details.workflowProgress ?? null);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load approval progress.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    const interval = window.setInterval(load, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [referenceNumber, shouldFetch]);

  if (shouldFetch && loading && !fetchedProgress) {
    return (
      <aside className={`card timeline-card approval-tracker ${compact ? "compact" : ""}`}>
        <h3>Approval progress</h3>
        <p>Loading the recorded approval steps...</p>
      </aside>
    );
  }

  if (shouldFetch && error && !fetchedProgress) {
    return (
      <aside className={`card timeline-card approval-tracker ${compact ? "compact" : ""}`}>
        <h3>Approval progress</h3>
        <p>{error}</p>
      </aside>
    );
  }

  const progress = shouldFetch ? fetchedProgress : providedProgress;

  if (!progress) {
    return (
      <aside className={`card timeline-card approval-tracker ${compact ? "compact" : ""}`}>
        <h3>Approval progress</h3>
        <p>Workflow information is not available for this document.</p>
      </aside>
    );
  }

  const currentStep =
    progress.currentStep ??
    progress.workflowSteps.find((step) => step.status === "Current") ??
    null;

  const remainingSteps = progress.workflowSteps.filter(
    (step) => step.status === "Pending" || step.status === "Current",
  );

  const rejectionRemarks = progress.workflowSteps
    .flatMap((step) => step.approvers)
    .filter((approver) => approver.status === "Rejected" && approver.remarks);

  return (
    <aside
      className={`card timeline-card approval-tracker ${compact ? "compact" : ""}`}
    >
      <h3>Approval progress</h3>
      <p>Current routing and approval status from the approval workflow.</p>

      <div className="approval-progress-summary">
        <strong>{progress.progressPercentage}% complete</strong>
        <span>
          {progress.completedSteps} of {progress.totalSteps} steps approved
        </span>

        <div className="approval-progress-track">
          <div
            className="approval-progress-fill"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="current-approval">
        <span className="small">
          {currentStep ? "Currently awaiting approval" : "Workflow status"}
        </span>

        <h4>{currentStep ? currentStep.stepName : progress.workflowStatus}</h4>

        {currentStep ? (
          <>
            <p className="small">{currentStep.roleName}</p>
            {currentStep.approvers.length > 0 ? (
              currentStep.approvers.map((approver) => (
                <div key={approver.userId} className="current-approver">
                  <strong>{approver.name || "Assigned approver"}</strong>
                  <span>{approver.status}</span>
                </div>
              ))
            ) : (
              <p className="small">No assignee has been recorded yet.</p>
            )}
          </>
        ) : (
          <p className="small">{workflowMessage(progress.workflowStatus)}</p>
        )}
      </div>

      {rejectionRemarks.length > 0 && (
        <div className="tracker-rejection">
          <Icon name="x" size={15} />
          <div>
            <strong>Rejection remarks</strong>
            {rejectionRemarks.map((approver) => (
              <p key={`${approver.userId}-${approver.actedAt}`}>
                {approver.remarks}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="tracker-remaining">
        <span className="eyebrow">Remaining steps</span>
        {remainingSteps.length > 0 ? (
          <p>
            {remainingSteps
              .map((step) => `${step.stepName} (${step.roleName})`)
              .join(" → ")}
          </p>
        ) : (
          <p>No approval steps remain.</p>
        )}
      </div>

      <hr />

      <h4>Approval route</h4>

      <div className="workflow-steps">
        {progress.workflowSteps.map((step) => (
          <div className="workflow-step" key={step.stepId}>
            <div className="workflow-step-heading">
              <span className="workflow-step-number">{step.stepOrder}</span>

              <div>
                <strong>{step.stepName}</strong>
                <p className="small">{step.roleName}</p>
              </div>

              <span className={`workflow-status ${step.status.toLowerCase()}`}>
                {step.status}
              </span>
            </div>

            {step.approvers.length > 0 ? (
              <div className="workflow-approvers">
                {step.approvers.map((approver) => (
                  <div key={approver.userId}>
                    <strong>{approver.name || "Assigned approver"}</strong>
                    <span>{approver.status}</span>

                    {approver.actedAt && (
                      <p className="small">Action: {formatDate(approver.actedAt)}</p>
                    )}

                    {approver.remarks && (
                      <p className="small">Remarks: {approver.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="small tracker-no-assignee">
                No approver has been assigned to this step yet.
              </p>
            )}
          </div>
        ))}
      </div>

      {!compact && (
        <>
          <hr />

          <h4>Workflow information</h4>

          <div className="info-grid">
            <Info label="Workflow status" value={progress.workflowStatus} />
            <Info label="Current cycle" value={String(progress.cycleNumber)} />
            <Info label="Started" value={formatDate(progress.startedAt)} />
            <Info
              label="Completed"
              value={formatDate(progress.completedAt)}
            />
          </div>
        </>
      )}
    </aside>
  );
}
