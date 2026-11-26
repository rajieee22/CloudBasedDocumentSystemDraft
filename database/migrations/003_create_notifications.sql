```sql
BEGIN;

-- =========================================
-- 1. NOTIFICATIONS
-- =========================================

CREATE TABLE public.notifications (
    notification_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- The user who receives this notification.
    user_id bigint NOT NULL,

    -- Related document request, if applicable.
    request_id bigint,

    notification_type varchar(50) NOT NULL,
    title varchar(150) NOT NULL,
    message text NOT NULL,

    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES public.app_users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_request
        FOREIGN KEY (request_id)
        REFERENCES public.document_requests(request_id)
        ON DELETE SET NULL
);

-- =========================================
-- 2. INDEXES
-- =========================================

-- Retrieve a user's notifications, newest first.
CREATE INDEX idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);

-- Retrieve unread notifications efficiently.
CREATE INDEX idx_notifications_user_unread
    ON public.notifications (user_id, created_at DESC)
    WHERE is_read = false;

-- =========================================
-- 3. VERIFY TABLE CREATION
-- =========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
    ) THEN
        RAISE EXCEPTION
            'Migration failed: notifications table was not created.';
    END IF;
END $$;

COMMIT;
```