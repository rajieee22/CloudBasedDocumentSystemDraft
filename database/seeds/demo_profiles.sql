
-- =====================================================
-- DEMONSTRATION PROFILE DATA
-- Cloud Document Approval System
-- Fictional data for development and testing only.
-- =====================================================

BEGIN;

-- Student demonstration profile: Andrea Santos
INSERT INTO public.student_profiles (
    user_id,
    student_number,
    college,
    department,
    program,
    year_level
)
SELECT
    user_id,
    'DEMO-2026-001',
    'College of Computer Studies',
    'Information Technology',
    'Bachelor of Science in Information Technology',
    3
FROM public.app_users
WHERE email = 'andrea.santos@example.test'
  AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = app_users.user_id
        AND r.role_code = 'STUDENT'
  )
ON CONFLICT (user_id) DO NOTHING;


-- Personnel demonstration profiles
INSERT INTO public.personnel_profiles (
    user_id,
    employee_number,
    college,
    department,
    position_title
)
SELECT
    u.user_id,
    demo.employee_number,
    'College of Computer Studies',
    'Information Technology',
    demo.position_title
FROM public.app_users u
JOIN (
    VALUES
        ('adviser@example.test', 'DEMO-EMP-001', 'Academic Adviser', 'ADVISER'),
        ('elena.villanueva@example.test', 'DEMO-EMP-002', 'Department Chairperson', 'CHAIRPERSON'),
        ('dean@example.test', 'DEMO-EMP-003', 'College Dean', 'DEAN'),
        ('registrar@example.test', 'DEMO-EMP-004', 'University Registrar', 'REGISTRAR')
) AS demo(email, employee_number, position_title, expected_role)
    ON u.email = demo.email
WHERE EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.role_id = ur.role_id
    WHERE ur.user_id = u.user_id
      AND r.role_code = demo.expected_role
)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
