BEGIN;

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS professor_user_id bigint,
  ADD COLUMN IF NOT EXISTS college_dean_user_id bigint,
  ADD COLUMN IF NOT EXISTS department_chairperson_user_id bigint;

INSERT INTO public.roles (role_code, role_name, description)
SELECT
  'PROFESSOR',
  'Professor',
  'Professor assigned to the student academic load revision workflow.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE role_code = 'PROFESSOR'
);

INSERT INTO public.app_users (
  email,
  password_hash,
  given_name,
  middle_name,
  family_name,
  is_active
)
SELECT
  'professor@example.test',
  '$argon2id$v=19$m=65536,t=3,p=4$1DCtY0R5pcNxmkeYzzz4pg$yC2rwfWuP3qbVcPs1IxiLLotusdjooTAuSufHWJeDUs',
  'Sample',
  NULL,
  'Professor',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_users WHERE email = 'professor@example.test'
);

INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT u.user_id, r.role_id, CURRENT_TIMESTAMP
FROM public.app_users u
CROSS JOIN public.roles r
WHERE u.email = 'professor@example.test'
  AND r.role_code = 'PROFESSOR'
ON CONFLICT DO NOTHING;

INSERT INTO public.personnel_profiles (
  user_id,
  employee_number,
  college,
  department,
  position_title
)
SELECT
  u.user_id,
  'DEMO-EMP-005',
  'College of Computer Studies',
  'Information Technology',
  'Professor'
FROM public.app_users u
WHERE u.email = 'professor@example.test'
  AND NOT EXISTS (
    SELECT 1 FROM public.personnel_profiles pp WHERE pp.user_id = u.user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.personnel_profiles pp WHERE pp.employee_number = 'DEMO-EMP-005'
  );

UPDATE public.student_profiles sp
SET professor_user_id = u.user_id
FROM public.app_users u
WHERE u.email = 'professor@example.test'
  AND sp.professor_user_id IS NULL;

UPDATE public.approval_workflow_steps aws
SET step_order = aws.step_order + 100
FROM public.roles r
WHERE aws.role_id = r.role_id
  AND r.role_code IN ('ADVISER', 'CHAIRPERSON', 'DEAN', 'REGISTRAR');

UPDATE public.approval_workflow_steps aws
SET step_order = CASE r.role_code
    WHEN 'ADVISER' THEN 2
    WHEN 'CHAIRPERSON' THEN 3
    WHEN 'DEAN' THEN 4
    WHEN 'REGISTRAR' THEN 5
  END
FROM public.roles r
WHERE aws.role_id = r.role_id
  AND aws.step_order > 100;

INSERT INTO public.approval_workflow_steps (
  workflow_id,
  step_order,
  role_id,
  step_name,
  is_active
)
SELECT
  aw.workflow_id,
  1,
  r.role_id,
  'Professor',
  TRUE
FROM public.approval_workflows aw
CROSS JOIN public.roles r
WHERE r.role_code = 'PROFESSOR'
  AND NOT EXISTS (
    SELECT 1
    FROM public.approval_workflow_steps aws
    WHERE aws.workflow_id = aw.workflow_id
      AND aws.role_id = r.role_id
  );

COMMIT;
