-- V5: Move student profiles to the university student-class model.
-- Legacy classes remain temporarily for compatibility while dependent modules are migrated.
ALTER TABLE students
    ALTER COLUMN class_id DROP NOT NULL;

ALTER TABLE students
    ADD CONSTRAINT ck_students_exactly_one_class
    CHECK (
        (class_id IS NOT NULL)
        <>
        (student_class_id IS NOT NULL)
    );

CREATE UNIQUE INDEX uq_students_email_lower
    ON students (LOWER(email))
    WHERE email IS NOT NULL;
