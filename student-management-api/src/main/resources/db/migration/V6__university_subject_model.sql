-- V6: Prepare the subject table for the university subject model.
-- Legacy columns are retained but made optional during the transition.
-- The application no longer reads or writes these school-specific fields.

UPDATE subjects s
SET department_id = d.id
FROM departments d
WHERE s.department_id IS NULL
  AND LOWER(BTRIM(s.department)) = LOWER(BTRIM(d.name));

ALTER TABLE subjects
    ALTER COLUMN department DROP NOT NULL,
    ALTER COLUMN evaluation_type DROP NOT NULL,
    ALTER COLUMN periods_grade10 DROP NOT NULL,
    ALTER COLUMN periods_grade11 DROP NOT NULL,
    ALTER COLUMN periods_grade12 DROP NOT NULL;

-- credits and department_id were introduced in V4.
-- Keep them nullable at database level so pre-existing legacy subject rows
-- remain readable until their department and credit data are reconciled.
