import type { RequestItem } from "../../types";
import { Button, Icon, StatusBadge } from "../../components/ui";

export function SubmissionSuccess({
  request,
  done,
}: {
  request: RequestItem;
  done: () => void;
}) {
  return (
    <div className="success-page">
      <div className="success-ring">
        <Icon name="check" size={32} />
      </div>
      <span className="eyebrow">Request received</span>
      <h2>Your document is on its way.</h2>
      <p>
        We've submitted your request and notified the first designated approver.
        You can follow every update from My Requests.
      </p>
      <div className="receipt">
        <span>Reference number</span>
        <strong>{request.id}</strong>
        <button onClick={() => navigator.clipboard?.writeText(request.id)}>
          Copy
        </button>
        <hr />
        <div>
          <span>Document</span>
          <b>{request.type}</b>
        </div>
        <div>
          <span>Status</span>
          <StatusBadge status="Pending" />
        </div>
        <div>
          <span>Submitted</span>
          <b>{request.date}</b>
        </div>
      </div>
      <div className="success-actions">
        <Button onClick={done}>Track my request</Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print receipt
        </Button>
      </div>
    </div>
  );
}
