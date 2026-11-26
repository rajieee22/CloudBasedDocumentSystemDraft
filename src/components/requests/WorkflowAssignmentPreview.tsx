import { Icon } from "../ui"
import type { WorkflowAssignmentsState } from "../../lib/workflowAssignments"

export function WorkflowAssignmentPreview({
  state,
}: {
  state: WorkflowAssignmentsState
}) {
  return (
    <div className="assignment-preview">
      <div className="assignment-preview-head">
        <Icon name="clock" size={15} />
        <strong>Backend approval assignments</strong>
      </div>

      {state.loading && (
        <p role="status">
          Checking your submitted documents for recorded approvers…
        </p>
      )}

      {state.error && (
        <div className="assignment-error" role="alert">
          <Icon name="x" size={14} />
          <span>{state.error}</span>
        </div>
      )}

      {!state.loading && !state.error && !state.assignments && (
        <p>
          No approval assignments are recorded for your account yet. The backend
          assigns the registered approvers after you submit.
        </p>
      )}

      {state.assignments && (
        <>
          <p className="small">
            Recorded on {state.assignments.referenceNumber}. Names below come
            from backend workflow data.
          </p>
          <div className="assignment-grid">
            {state.assignments.roles.map((role) => (
              <div className="assignment-item" key={role.key}>
                <span>{role.label}</span>
                <strong className="auto-value">
                  {role.name ?? "Not assigned yet"}
                </strong>
                <small>{role.status ?? "Awaiting assignment"}</small>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="assignment-limit">
        Workflow order: Professor, academic adviser, department chairperson,
        college dean, then university registrar. The professor name is entered
        on the permit; the remaining approvers come from the university
        workflow.
      </p>
    </div>
  )
}
