const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface NotificationItem {
  id: string;
  requestId: string | null;
  referenceNumber: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsApiResponse {
  success: boolean;
  message?: string;
  notifications: NotificationItem[];
}

interface UnreadCountApiResponse {
  success: boolean;
  message?: string;
  unreadCount: number;
}

interface NotificationActionApiResponse {
  success: boolean;
  message?: string;
  updatedCount?: number;
}

// ============================================
// NOTIFICATION API ERROR
// ============================================

export class NotificationApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "NotificationApiError";
  }
}

// ============================================
// SHARED REQUEST HANDLER
// ============================================

async function notificationFetch<T>(
  endpoint: string,
  method: "GET" | "PATCH" = "GET"
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/notifications${endpoint}`,
      {
        method,
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
    throw new NotificationApiError(
      data.message || "Unable to process notification request.",
      response.status
    );
  }

  return data as T;
}

// ============================================
// RETRIEVE NOTIFICATIONS
// ============================================

export async function getNotificationsApi(): Promise<NotificationItem[]> {
  const data = await notificationFetch<NotificationsApiResponse>("");

  return data.notifications;
}

// ============================================
// RETRIEVE UNREAD COUNT
// ============================================

export async function getUnreadNotificationCountApi(): Promise<number> {
  const data = await notificationFetch<UnreadCountApiResponse>(
    "/unread-count"
  );

  return data.unreadCount;
}

// ============================================
// MARK ONE NOTIFICATION AS READ
// ============================================

export async function markNotificationAsReadApi(
  notificationId: string
): Promise<void> {
  await notificationFetch<NotificationActionApiResponse>(
    `/${encodeURIComponent(notificationId)}/read`,
    "PATCH"
  );
}

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================

export async function markAllNotificationsAsReadApi(): Promise<number> {
  const data = await notificationFetch<NotificationActionApiResponse>(
    "/read-all",
    "PATCH"
  );

  return data.updatedCount ?? 0;
}