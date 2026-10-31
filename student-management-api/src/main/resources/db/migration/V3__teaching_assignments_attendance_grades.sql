-- V3: Phân công giảng dạy, điểm danh và điểm số.
-- Dữ liệu nghiệp vụ lưu tại PostgreSQL, không phụ thuộc trạng thái bộ nhớ của FE.

-- Một giáo viên có thể dạy nhiều lớp/môn; một lớp/môn có thể có nhiều giáo viên.
CREATE TABLE teacher_class_subjects (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id  BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id    BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_teacher_class_subject UNIQUE (teacher_id, class_id, subject_id)
);
CREATE INDEX idx_tcs_teacher ON teacher_class_subjects(teacher_id);
CREATE INDEX idx_tcs_class_subject ON teacher_class_subjects(class_id, subject_id);

-- Mỗi học sinh có tối đa một bản ghi điểm danh trong cùng buổi/ngày.
CREATE TABLE attendance_records (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id   BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id     BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id   BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id   BIGINT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL,
    session      VARCHAR(10) NOT NULL CHECK (session IN ('MORNING', 'AFTERNOON')),
    status       VARCHAR(12) NOT NULL CHECK (status IN ('PRESENT', 'EXCUSED', 'UNEXCUSED', 'LATE')),
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_attendance_student_session UNIQUE (student_id, attendance_date, session)
);
CREATE INDEX idx_attendance_class_date ON attendance_records(class_id, attendance_date, session);
CREATE INDEX idx_attendance_student_date ON attendance_records(student_id, attendance_date DESC);

-- Mỗi điểm gắn với học sinh, môn, học kỳ, năm học và loại điểm.
CREATE TABLE grade_records (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id  BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id    BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id  BIGINT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    school_year VARCHAR(9) NOT NULL,
    semester    SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    assessment_type VARCHAR(12) NOT NULL CHECK (assessment_type IN ('ORAL', 'FIFTEEN_MIN', 'ONE_PERIOD', 'MIDTERM', 'FINAL')),
    assessment_number SMALLINT NOT NULL DEFAULT 1 CHECK (assessment_number > 0),
    score       NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_grade_assessment UNIQUE (student_id, subject_id, school_year, semester, assessment_type, assessment_number)
);
CREATE INDEX idx_grades_class_subject_term ON grade_records(class_id, subject_id, school_year, semester);
CREATE INDEX idx_grades_student_term ON grade_records(student_id, school_year, semester);
