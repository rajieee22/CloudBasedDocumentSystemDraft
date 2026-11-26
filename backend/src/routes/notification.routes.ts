
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";

import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController
} from "../controllers/notification.controller.js";

const router = Router();

// Retrieve all notifications belonging to the authenticated user
router.get(
  "/",
  requireAuth,
  getNotificationsController
);

// Retrieve unread notification count
router.get(
  "/unread-count",
  requireAuth,
  getUnreadNotificationCountController
);

// Mark all notifications as read
router.patch(
  "/read-all",
  requireAuth,
  markAllNotificationsAsReadController
);

// Mark one notification as read
router.patch(
  "/:notificationId/read",
  requireAuth,
  markNotificationAsReadController
);

export default router;
