import type { RequestItem } from "../../types";
import { Icon, StatusBadge } from "../ui";

export function RequestTable({
  data,
  onOpen,
  onReview,
  approver = false,
}: {
  data: RequestItem[];
  onOpen: (r: RequestItem) => void;
  onReview?: (r: RequestItem) => void;
  approver?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            {approver && <th>Student</th>}
            <th>Document type</th>
            <th>Submitted</th>
            <th>Current step</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, index) => (
            <tr
              key={`${r.id}-${r.type}-${r.date}-${index}`}
              onClick={() => onOpen(r)}
            >
              <td>
                <strong className="ref">{r.id}</strong>
              </td>
              {approver && (
                <td>
                  <div className="student-cell">
                    <span>
                      {r.student
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <strong>{r.student}</strong>
                  </div>
                </td>
              )}
              <td>
                <div className="doc-cell">
                  <span>
                    <Icon name="file" size={17} />
                  </span>
                  {r.type}
                </div>
              </td>
              <td>{r.date}</td>
              <td>{r.stage || "Not available"}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td>
                <div className="row-actions">
                  {approver && onReview && r.status === "Pending" && (
                    <button
                      className="row-review"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReview(r);
                      }}
                    >
                      Review
                    </button>
                  )}
                  <button
                    className="row-action"
                    aria-label="View request"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(r);
                    }}
                  >
                    <Icon name="eye" size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
