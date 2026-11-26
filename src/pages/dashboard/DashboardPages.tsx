import { useCallback, useEffect, useState } from "react";

import type { Page, RequestItem, Status } from "../../types";
import { Button, Icon, StatusBadge } from "../../components/ui";
import { RequestTable } from "../../components/requests/RequestTable";
import { ApprovalTracker } from "../../components/requests/ApprovalTracker";
import {
  getStudentDashboardApi,
  getApproverDashboardApi,
  type StudentDashboardData,
  type StudentDashboardRequest,
  type ApproverDashboardData,
  type ApproverDashboardRequest,
} from "../../lib/dashboard";

export function StatCard({
  label,
  value,
  icon,
  tone,
  trend,
}: {
  label: string;
  value: number;
  icon: string;
  tone: string;
  trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {trend && <small>{trend}</small>}
      </div>
    </div>
  );
}

function formatRequestDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toRequestItem(
  request: StudentDashboardRequest,
  studentName: string,
): RequestItem {
  return {
    id: request.referenceNumber,
    type: request.type,
    student: studentName,
    date: formatRequestDate(request.submittedAt),
    stage: request.status,
    status: request.status as Status,
  };
}

function toApproverRequestItem(request: ApproverDashboardRequest): RequestItem {
  return {
    id: request.referenceNumber,
    type: request.type,
    student: request.studentName,
    date: formatRequestDate(request.submittedAt),
    stage: request.status,
    status: request.status as Status,
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function StudentDashboard({
  navigate,
  open,
  studentName,
}: {
  navigate: (p: Page) => void;
  open: (r: RequestItem) => void;
  studentName: string;
}) {
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const result = await getStudentDashboardApi();

      setDashboard(result);
      setError(null);
    } catch (err) {
      console.error("Student dashboard loading failed:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshDashboard() {
      try {
        const result = await getStudentDashboardApi();

        if (active) {
          setDashboard(result);
          setError(null);
        }
      } catch (err) {
        if (active) {
          console.error("Student dashboard loading failed:", err);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    refreshDashboard();

    const interval = window.setInterval(() => {
      refreshDashboard();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const stats = dashboard?.stats;

  const recentRequests = (dashboard?.recentRequests ?? []).map((request) =>
    toRequestItem(request, studentName),
  );

  const activeRequest = dashboard?.activeRequest
    ? toRequestItem(dashboard.activeRequest, studentName)
    : null;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading && !dashboard) {
    return (
      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Loading your dashboard...</h3>
            <p>Retrieving your document requests.</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && !dashboard) {
    return (
      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
          <Button variant="secondary" onClick={() => loadDashboard(true)}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">{today}</span>
          <h2>
            {getGreeting()}, {studentName.split(" ")[0]}.
          </h2>
          <p>
            {stats?.pending ?? 0} document
            {(stats?.pending ?? 0) === 1 ? "" : "s"} currently waiting for
            review.
          </p>
        </div>

        <Button icon="plus" onClick={() => navigate("new")}>
          New document request
        </Button>
      </div>

      {error && (
        <section className="card table-card">
          <p>
            Dashboard refresh failed: {error}. Showing the last successfully
            loaded information.
          </p>
          <Button variant="secondary" onClick={() => loadDashboard()}>
            Refresh now
          </Button>
        </section>
      )}

      <div className="stats-grid">
        <StatCard
          label="Total requests"
          value={stats?.total ?? 0}
          icon="file"
          tone="tone-maroon"
        />

        <StatCard
          label="Pending"
          value={stats?.pending ?? 0}
          icon="clock"
          tone="tone-amber"
        />

        <StatCard
          label="Approved"
          value={stats?.approved ?? 0}
          icon="check"
          tone="tone-green"
        />

        <StatCard
          label="Returned / Rejected"
          value={(stats?.returned ?? 0) + (stats?.rejected ?? 0)}
          icon="rotate"
          tone="tone-red"
        />
      </div>

      <div className="dashboard-grid">
        <section className="card table-card">
          <div className="card-head">
            <div>
              <h3>Recent document requests</h3>
              <p>Your latest submissions and their current status.</p>
            </div>

            <Button variant="ghost" onClick={() => navigate("requests")}>
              View all <Icon name="arrow" size={15} />
            </Button>
          </div>

          {recentRequests.length > 0 ? (
            <RequestTable data={recentRequests} onOpen={open} />
          ) : (
            <p>You haven't submitted any document requests yet.</p>
          )}
        </section>

        <aside className="card progress-card">
          <div className="card-head">
            <div>
              <h3>Active request</h3>
              <p>{activeRequest?.id ?? "No active request"}</p>
            </div>

            {activeRequest && <StatusBadge status={activeRequest.status} />}
          </div>

          {activeRequest ? (
            <>
              <div className="active-document">
                <div className="doc-big">
                  <Icon name="file" />
                </div>

                <div>
                  <strong>{activeRequest.type}</strong>
                  <span>Submitted {activeRequest.date}</span>
                </div>
              </div>

              <ApprovalTracker
                referenceNumber={activeRequest.id}
                compact
              />

              <Button
                variant="secondary"
                className="full"
                onClick={() => open(activeRequest)}
              >
                Track request
              </Button>
            </>
          ) : (
            <p>
              You don't currently have a pending request or a request returned
              for revision.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

export function Step({
  label,
  meta,
  done,
  current,
}: {
  label: string;
  meta: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <div
      className={`step ${done ? "step-done" : ""} ${
        current ? "step-current" : ""
      }`}
    >
      <div className="step-mark">
        {done ? <Icon name="check" size={13} /> : <span />}
      </div>

      <div>
        <strong>{label}</strong>
        <small>{meta}</small>
      </div>

      {current && <em>Current</em>}
    </div>
  );
}

export function ApproverDashboard({
  navigate,
  open,
}: {
  navigate: (p: Page) => void;
  open: (r: RequestItem) => void;
  queue?: RequestItem[];
}) {
  const [dashboard, setDashboard] = useState<ApproverDashboardData | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const result = await getApproverDashboardApi();

      setDashboard(result);
      setError(null);
    } catch (err) {
      console.error("Approver dashboard loading failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the approver dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshDashboard() {
      try {
        const result = await getApproverDashboardApi();

        if (active) {
          setDashboard(result);
          setError(null);
        }
      } catch (err) {
        if (active) {
          console.error("Approver dashboard loading failed:", err);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the approver dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    refreshDashboard();

    const interval = window.setInterval(() => {
      refreshDashboard();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const stats = dashboard?.stats;

  const pendingRequests = (dashboard?.pendingRequests ?? []).map(
    toApproverRequestItem,
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading && !dashboard) {
    return (
      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Loading approver dashboard...</h3>
            <p>Retrieving document requests from the database.</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && !dashboard) {
    return (
      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Unable to load approver dashboard</h3>
            <p>{error}</p>
          </div>

          <Button variant="secondary" onClick={() => loadDashboard(true)}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">{today} · Approver workspace</span>

          <h2>Welcome to your approval dashboard.</h2>

          <p>
            {stats?.pending ?? 0} document
            {(stats?.pending ?? 0) === 1 ? "" : "s"} currently waiting for
            review.
          </p>
        </div>

        <Button variant="secondary" onClick={() => navigate("requests")}>
          View approval queue
        </Button>
      </div>

      {error && (
        <section className="card table-card">
          <p>
            Dashboard refresh failed: {error}. Showing the last successfully
            loaded information.
          </p>

          <Button variant="secondary" onClick={() => loadDashboard()}>
            Refresh now
          </Button>
        </section>
      )}

      <div className="stats-grid">
        <StatCard
          label="Total submitted"
          value={stats?.total ?? 0}
          icon="file"
          tone="tone-maroon"
        />

        <StatCard
          label="Pending approvals"
          value={stats?.pending ?? 0}
          icon="clock"
          tone="tone-amber"
        />

        <StatCard
          label="Approved documents"
          value={stats?.approved ?? 0}
          icon="check"
          tone="tone-green"
        />

        <StatCard
          label="Returned / Rejected"
          value={(stats?.returned ?? 0) + (stats?.rejected ?? 0)}
          icon="rotate"
          tone="tone-red"
        />
      </div>

      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Requests awaiting action</h3>
            <p>Pending submissions ordered from oldest to newest.</p>
          </div>

          <Button variant="ghost" onClick={() => navigate("requests")}>
            View full queue <Icon name="arrow" size={15} />
          </Button>
        </div>

        {pendingRequests.length > 0 ? (
          <RequestTable data={pendingRequests} onOpen={open} approver />
        ) : (
          <div className="empty">
            <Icon name="check" size={28} />
            <h3>No pending approvals</h3>
            <p>
              The backend has not assigned any document awaiting your review.
            </p>
          </div>
        )}
      </section>

      <div className="approver-foot">
        <div className="card quick-card">
          <div className="stat-icon tone-maroon">
            <Icon name="pen" />
          </div>

          <div>
            <h3>Manage your e-signature</h3>
            <p>Review your signature settings before approving documents.</p>
          </div>

          <Button variant="secondary" onClick={() => navigate("signature")}>
            Manage signature
          </Button>
        </div>

        <div className="card reminder">
          <Icon name="clock" />

          <div>
            <strong>Request overview</strong>
            <span>{stats?.total ?? 0} submitted documents</span>
          </div>
        </div>
      </div>
    </>
  );
}
