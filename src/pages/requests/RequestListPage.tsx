import { useMemo, useState } from "react";
import type { RequestItem, Role } from "../../types";
import { Icon } from "../../components/ui";
import { RequestTable } from "../../components/requests/RequestTable";

type RequestListMode = "student" | "pending" | "processed";

export function RequestsPage({
  data,
  role,
  mode = "student",
  open,
  onReview,
}: {
  data: RequestItem[];
  role: Role;
  mode?: RequestListMode;
  open: (r: RequestItem) => void;
  onReview?: (r: RequestItem) => void;
}) {
  const [filter, setFilter] = useState(mode === "pending" ? "Pending" : "All");
  const [search, setSearch] = useState("");

  const list = useMemo(
    () =>
      data.filter(
        (r) =>
          (filter === "All" || r.status === filter) &&
          (r.id + r.type + r.student + r.stage)
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, filter, search],
  );

  const filters =
    mode === "pending"
      ? ["Pending"]
      : role === "student"
        ? ["All", "Pending", "Approved", "Returned for Revision", "Completed"]
        : [
            "All",
            "Pending",
            "Approved",
            "Rejected",
            "Returned for Revision",
            "Completed",
          ];

  const emptyMessage =
    mode === "pending"
      ? "No documents are currently waiting for your approval."
      : mode === "processed"
        ? "No documents have been assigned to your account yet."
        : "You have not submitted any document requests yet.";

  return (
    <>
      <div className="list-toolbar">
        <div className="search-box">
          <Icon name="search" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, document, student, or step…"
          />
        </div>
        <span className="list-count">
          Showing {list.length} of {data.length} document
          {data.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="filter-tabs">
        {filters.map((x) => (
          <button
            key={x}
            className={filter === x ? "active" : ""}
            onClick={() => setFilter(x)}
          >
            {x}
            <span>
              {x === "All"
                ? data.length
                : data.filter((r) => r.status === x).length}
            </span>
          </button>
        ))}
      </div>

      <section className="card request-list">
        {list.length ? (
          <RequestTable
            data={list}
            onOpen={open}
            onReview={onReview}
            approver={role === "approver"}
          />
        ) : (
          <div className="empty">
            <Icon name={mode === "pending" ? "check" : "search"} size={28} />
            <h3>
              {mode === "pending" ? "All caught up" : "No matching requests"}
            </h3>
            <p>
              {search || filter !== "All"
                ? "Try adjusting your search or selected status filter."
                : emptyMessage}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
