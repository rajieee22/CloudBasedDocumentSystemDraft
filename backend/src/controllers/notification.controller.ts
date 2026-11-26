
import type { Request, Response } from "express";
import { z } from "zod";

import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../services/notification.service.js";

// Retrieve all notifications belonging to the authenticated user.
export async function getNotificationsController(
  req: Request,
  res: Response
) {
  const authenticatedUser = req.session.user;

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  try {
    const notifications = await getUserNotifications(
      authenticatedUser.id
    );

    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Notification retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve notifications."
    });
  }
}

// Retrieve the unread notification count.
export async function getUnreadNotificationCountController(
  req: Request,
  res: Response
) {
  const authenticatedUser = req.session.user;

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  try {
    const unreadCount = await getUnreadNotificationCount(
      authenticatedUser.id
    );

    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Unread notification count retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve unread notification count."
    });
  }
}

// Mark an individual notification as read.
export async function markNotificationAsReadController(
  req: Request,
  res: Response
) {
  const authenticatedUser = req.session.user;

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  const notificationId = z
    .guid({ message: "A valid notification ID is required." })
    .safeParse(req.params.notificationId ?? "");

  if (!notificationId.success) {
    return res.status(400).json({
      success: false,
      message: "A valid notification ID is required."
    });
  }

  try {
    const updated = await markNotificationAsRead(
      notificationId.data,
      authenticatedUser.id
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or already marked as read."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read."
    });
  } catch (error) {
    console.error("Notification update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification."
    });
  }
}

// Mark all notifications belonging to the authenticated user as read.
export async function markAllNotificationsAsReadController(
  req: Request,
  res: Response
) {
  const authenticatedUser = req.session.user;

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  try {
    const updatedCount = await markAllNotificationsAsRead(
      authenticatedUser.id
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      updatedCount
    });
  } catch (error) {
    console.error("Bulk notification update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read."
    });
  }
}
