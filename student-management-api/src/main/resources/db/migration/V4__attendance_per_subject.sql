-- V4: Điểm danh được định danh theo lớp + môn + sinh viên + ngày + buổi.
-- Giữ lại dữ liệu cũ subject_id IS NULL bằng một unique index riêng.
ALTER TABLE attendance_records
    DROP CONSTRAINT IF EXISTS uq_attendance_student_session;

CREATE UNIQUE INDEX uq_attendance_student_subject_session
    ON attendance_records (student_id, attendance_date, session, subject_id)
    WHERE subject_id IS NOT NULL;

CREATE UNIQUE INDEX uq_attendance_student_unassigned_session
    ON attendance_records (student_id, attendance_date, session)
    WHERE subject_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_class_subject_date
    ON attendance_records (class_id, subject_id, attendance_date, session);
