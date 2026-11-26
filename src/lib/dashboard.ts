
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// ============================================
// STUDENT DASHBOARD TYPES
// ============================================

export interface StudentDashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  returned: number;
  completed: number;
}

export interface StudentDashboardRequest {
  id: string;
  referenceNumber: string;
  type: string;
  status: string;
  submittedAt: string;
}

export interface StudentDashboardActiveRequest
  extends StudentDashboardRequest {
  stage: string;
}

export interface StudentDashboardData {
  stats: StudentDashboardStats;
  recentRequests: StudentDashboardRequest[];
  activeRequest: StudentDashboardActiveRequest | null;
}

interface StudentDashboardApiResponse {
  success: boolean;
  message?: string;
  dashboard: StudentDashboardData;
}

// ============================================
// APPROVER DASHBOARD TYPES
// ============================================

export interface ApproverDashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  returned: number;
  completed: number;
}

export interface ApproverDashboardRequest {
  id: string;
  referenceNumber: string;
  type: string;
  studentName: string;
  studentNumber: string | null;
  status: string;
  submittedAt: string;
}

export interface ApproverDashboardData {
  stats: ApproverDashboardStats;
  recentRequests: ApproverDashboardRequest[];
  pendingRequests: ApproverDashboardRequest[];
}

interface ApproverDashboardApiResponse {
  success: boolean;
  message?: string;
  dashboard: ApproverDashboardData;
}

// ============================================
// DASHBOARD API ERROR
// ============================================

export class DashboardApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "DashboardApiError";
  }
}

// ============================================
// STUDENT DASHBOARD API
// ============================================

export async function getStudentDashboardApi(): Promise<StudentDashboardData> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/dashboard/student`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new DashboardApiError(
      data.message || "Unable to load your dashboard.",
      response.status
    );
  }

  return (data as StudentDashboardApiResponse).dashboard;
}

// ============================================
// APPROVER DASHBOARD API
// ============================================

export async function getApproverDashboardApi(): Promise<ApproverDashboardData> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/dashboard/approver`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new DashboardApiError(
      data.message || "Unable to load the approver dashboard.",
      response.status
    );
  }

  return (data as ApproverDashboardApiResponse).dashboard;
}
