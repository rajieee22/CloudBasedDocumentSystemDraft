
BEGIN;

-- =========================================
-- 1. SHIFTER APPLICATION DETAILS
-- =========================================

ALTER TABLE public.shifter_application_details
    ADD COLUMN current_program varchar(120),
    ADD COLUMN intended_program varchar(120);

-- Preserve the existing reason data under its new name.
ALTER TABLE public.shifter_application_details
    RENAME COLUMN reason TO reason_for_shifting;

-- Recover current program for existing requests where possible.
UPDATE public.shifter_application_details AS sad
SET current_program = sp.program
FROM public.document_requests AS dr
JOIN public.student_profiles AS sp
    ON sp.user_id = dr.student_user_id
WHERE sad.request_id = dr.request_id
  AND sad.current_program IS NULL;

-- =========================================
-- 2. LEAVE OF ABSENCE DETAILS
-- =========================================

ALTER TABLE public.leave_of_absence_details
    ADD COLUMN current_academic_year varchar(60),
    ADD COLUMN semester varchar(60);

-- Preserve the existing reason data under its new name.
ALTER TABLE public.leave_of_absence_details
    RENAME COLUMN reason TO reason_of_absence;

-- =========================================
-- 3. CHECK LEGACY DATA BEFORE NOT NULL
-- =========================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.shifter_application_details
        WHERE current_program IS NULL
           OR intended_program IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: existing shifter records need current_program and intended_program values.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.leave_of_absence_details
        WHERE current_academic_year IS NULL
           OR semester IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: existing leave records need current_academic_year and semester values.';
    END IF;
END $$;

-- Apply NOT NULL after legacy records have been checked.
ALTER TABLE public.shifter_application_details
    ALTER COLUMN current_program SET NOT NULL,
    ALTER COLUMN intended_program SET NOT NULL;

ALTER TABLE public.leave_of_absence_details
    ALTER COLUMN current_academic_year SET NOT NULL,
    ALTER COLUMN semester SET NOT NULL;

COMMIT;
