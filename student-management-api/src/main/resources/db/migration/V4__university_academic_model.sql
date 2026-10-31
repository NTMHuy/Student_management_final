-- V4: Add university academic model alongside the legacy school schema.
-- This migration is additive: it does not rename/drop legacy tables or rewrite V1-V3.
-- Railway/production must not receive this migration without explicit approval.

CREATE TABLE departments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE majors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    major_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_majors_department ON majors(department_id);

CREATE TABLE student_classes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    major_id BIGINT NOT NULL REFERENCES majors(id) ON DELETE RESTRICT,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    intake_year SMALLINT NOT NULL CHECK (intake_year BETWEEN 2000 AND 2200),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_classes_name_intake UNIQUE (class_name, intake_year)
);
CREATE INDEX idx_student_classes_major ON student_classes(major_id);

CREATE TABLE semesters (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    academic_year VARCHAR(9) NOT NULL,
    term_number SMALLINT NOT NULL CHECK (term_number IN (1, 2, 3)),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
        CHECK (status IN ('PLANNED', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_semesters_date_range CHECK (end_date > start_date),
    CONSTRAINT uq_semesters_year_term UNIQUE (academic_year, term_number)
);

-- One course section is one offering of a subject in one semester.
CREATE TABLE course_sections (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    semester_id BIGINT NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    section_code VARCHAR(30) NOT NULL,
    section_name VARCHAR(150),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    process_weight NUMERIC(5,2) NOT NULL,
    midterm_weight NUMERIC(5,2) NOT NULL,
    final_weight NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_sections_semester_code UNIQUE (semester_id, section_code),
    CONSTRAINT ck_course_section_weights CHECK (
        process_weight >= 0 AND midterm_weight >= 0 AND final_weight >= 0
        AND process_weight + midterm_weight + final_weight = 100
    )
);
CREATE INDEX idx_course_sections_subject ON course_sections(subject_id);
CREATE INDEX idx_course_sections_semester ON course_sections(semester_id);
CREATE INDEX idx_course_sections_status ON course_sections(status);

CREATE TABLE enrollments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_section_id BIGINT NOT NULL REFERENCES course_sections(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED'
        CHECK (status IN ('REGISTERED', 'ACTIVE', 'WITHDRAWN', 'COMPLETED', 'FAILED')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollments_student_section UNIQUE (student_id, course_section_id),
    CONSTRAINT ck_enrollment_withdrawn_at CHECK (
        (status = 'WITHDRAWN' AND withdrawn_at IS NOT NULL)
        OR (status <> 'WITHDRAWN' AND withdrawn_at IS NULL)
    )
);
CREATE INDEX idx_enrollments_section_status ON enrollments(course_section_id, status);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);

CREATE TABLE teaching_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    course_section_id BIGINT NOT NULL REFERENCES course_sections(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_teaching_assignment_teacher_section UNIQUE (teacher_id, course_section_id)
);
CREATE INDEX idx_teaching_assignments_teacher ON teaching_assignments(teacher_id);
CREATE INDEX idx_teaching_assignments_section ON teaching_assignments(course_section_id);

CREATE TABLE course_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_section_id BIGINT NOT NULL REFERENCES course_sections(id) ON DELETE RESTRICT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_course_sessions_time CHECK (end_time > start_time)
);
CREATE INDEX idx_course_sessions_section_date ON course_sessions(course_section_id, session_date);

-- New attendance table keeps the old school attendance table intact during transition.
CREATE TABLE university_attendance_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_session_id BIGINT NOT NULL REFERENCES course_sessions(id) ON DELETE RESTRICT,
    enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    status VARCHAR(12) NOT NULL CHECK (status IN ('PRESENT', 'EXCUSED', 'UNEXCUSED', 'LATE')),
    note TEXT,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_university_attendance_session_enrollment
        UNIQUE (course_session_id, enrollment_id)
);
CREATE INDEX idx_university_attendance_enrollment ON university_attendance_records(enrollment_id);

-- New grade table keeps V3 school-grade records intact during transition.
CREATE TABLE university_grade_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    component_type VARCHAR(10) NOT NULL
        CHECK (component_type IN ('PROCESS', 'MIDTERM', 'FINAL')),
    attempt_number SMALLINT NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
    score NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    note TEXT,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_university_grade_attempt
        UNIQUE (enrollment_id, component_type, attempt_number),
    CONSTRAINT ck_university_single_attempt_components CHECK (
        component_type = 'PROCESS' OR attempt_number = 1
    )
);
CREATE INDEX idx_university_grade_enrollment ON university_grade_records(enrollment_id);

CREATE TABLE university_grade_results (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id BIGINT NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE RESTRICT,
    process_weight_snapshot NUMERIC(5,2) NOT NULL,
    midterm_weight_snapshot NUMERIC(5,2) NOT NULL,
    final_weight_snapshot NUMERIC(5,2) NOT NULL,
    process_average NUMERIC(4,2),
    midterm_score NUMERIC(4,2),
    final_score NUMERIC(4,2),
    total_score NUMERIC(4,2),
    calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_university_grade_result_weights CHECK (
        process_weight_snapshot >= 0 AND midterm_weight_snapshot >= 0
        AND final_weight_snapshot >= 0
        AND process_weight_snapshot + midterm_weight_snapshot + final_weight_snapshot = 100
    ),
    CONSTRAINT ck_university_grade_result_scores CHECK (
        (process_average IS NULL OR process_average BETWEEN 0 AND 10)
        AND (midterm_score IS NULL OR midterm_score BETWEEN 0 AND 10)
        AND (final_score IS NULL OR final_score BETWEEN 0 AND 10)
        AND (total_score IS NULL OR total_score BETWEEN 0 AND 10)
    ),
    CONSTRAINT ck_university_grade_result_completion CHECK (
        (process_average IS NOT NULL AND midterm_score IS NOT NULL AND final_score IS NOT NULL)
        OR total_score IS NULL
    )
);

-- Transitional optional links on existing profiles. Legacy class_id remains unchanged.
ALTER TABLE students ADD COLUMN student_class_id BIGINT
    REFERENCES student_classes(id) ON DELETE RESTRICT;
ALTER TABLE students ADD COLUMN email VARCHAR(255);
CREATE INDEX idx_students_student_class_id ON students(student_class_id);

ALTER TABLE teachers ADD COLUMN department_id BIGINT
    REFERENCES departments(id) ON DELETE SET NULL;
CREATE INDEX idx_teachers_department_id ON teachers(department_id);

ALTER TABLE subjects ADD COLUMN department_id BIGINT
    REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE subjects ADD COLUMN credits SMALLINT
    CHECK (credits IS NULL OR credits > 0);
CREATE INDEX idx_subjects_department_id ON subjects(department_id);
