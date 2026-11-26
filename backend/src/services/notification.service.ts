import { pool } from "../config/database.js";

export async function getUserNotifications(userId: string) {
  const result = await pool.query(
    `
    SELECT
      n.notification_id,
      n.request_id,
      dr.reference_number,
      n.notification_type,
      n.title,
      n.message,
      n.is_read,
      n.created_at
    FROM public.notifications n
    LEFT JOIN public.document_requests dr
      ON dr.request_id = n.request_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC, n.notification_id DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.notification_id.toString(),
    requestId: row.request_id?.toString() ?? null,
    referenceNumber: row.reference_number ?? null,
    type: row.notification_type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function getUnreadNotificationCount(userId: string) {
  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS unread_count
    FROM public.notifications
    WHERE user_id = $1
      AND is_read = FALSE
    `,
    [userId]
  );

  return result.rows[0].unread_count as number;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  const result = await pool.query(
    `
    UPDATE public.notifications
    SET is_read = TRUE
    WHERE notification_id = $1
      AND user_id = $2
      AND is_read = FALSE
    RETURNING notification_id
    `,
    [notificationId, userId]
  );

  return result.rowCount === 1;
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await pool.query(
    `
    UPDATE public.notifications
    SET is_read = TRUE
    WHERE user_id = $1
      AND is_read = FALSE
    `,
    [userId]
  );

  return result.rowCount ?? 0;
}