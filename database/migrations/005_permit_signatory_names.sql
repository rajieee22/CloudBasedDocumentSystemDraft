BEGIN;

ALTER TABLE public.load_revision_details
  ADD COLUMN IF NOT EXISTS professor_name text,
  ADD COLUMN IF NOT EXISTS professor_user_id bigint,
  ADD COLUMN IF NOT EXISTS college_dean_name text,
  ADD COLUMN IF NOT EXISTS department_chairperson_name text;

COMMIT;
