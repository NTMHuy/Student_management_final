-- V5: Nâng cấp cấu trúc điểm theo mô hình PROCESS / MIDTERM / FINAL.
-- Migration chỉ chuyển đổi nhãn các điểm quá trình cũ; không xóa/gộp bất kỳ bản ghi điểm nào.

-- Chụp lại các điểm đã đủ 5 cột theo đúng công thức cũ của giao diện
-- để có thể bảo toàn kết quả đang hiển thị trước khi đổi mô hình.
CREATE TEMPORARY TABLE legacy_grade_result_seed ON COMMIT DROP AS
SELECT student_id,
       class_id,
       subject_id,
       school_year,
       semester,
       MAX(score) FILTER (WHERE assessment_type = 'ORAL' AND assessment_number = 1) AS tx1,
       MAX(score) FILTER (WHERE assessment_type = 'FIFTEEN_MIN' AND assessment_number = 1) AS tx2,
       MAX(score) FILTER (WHERE assessment_type = 'ONE_PERIOD' AND assessment_number = 1) AS tx3,
       MAX(score) FILTER (WHERE assessment_type = 'MIDTERM' AND assessment_number = 1) AS midterm_score,
       MAX(score) FILTER (WHERE assessment_type = 'FINAL' AND assessment_number = 1) AS final_score
FROM grade_records
GROUP BY student_id, class_id, subject_id, school_year, semester
HAVING COUNT(*) FILTER (WHERE assessment_type = 'ORAL' AND assessment_number = 1) > 0
   AND COUNT(*) FILTER (WHERE assessment_type = 'FIFTEEN_MIN' AND assessment_number = 1) > 0
   AND COUNT(*) FILTER (WHERE assessment_type = 'ONE_PERIOD' AND assessment_number = 1) > 0
   AND COUNT(*) FILTER (WHERE assessment_type = 'MIDTERM' AND assessment_number = 1) > 0
   AND COUNT(*) FILTER (WHERE assessment_type = 'FINAL' AND assessment_number = 1) > 0;

ALTER TABLE subjects
    ADD COLUMN process_weight NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    ADD COLUMN midterm_weight NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    ADD COLUMN final_weight NUMERIC(5,2) NOT NULL DEFAULT 40.00;

ALTER TABLE subjects
    ADD CONSTRAINT ck_subject_grade_weights_range
        CHECK (
            process_weight BETWEEN 0 AND 100
            AND midterm_weight BETWEEN 0 AND 100
            AND final_weight BETWEEN 0 AND 100
        ),
    ADD CONSTRAINT ck_subject_grade_weights_sum
        CHECK (process_weight + midterm_weight + final_weight = 100.00);

-- Bỏ CHECK cũ trước khi đổi các nhãn loại điểm sang PROCESS.
ALTER TABLE grade_records
    DROP CONSTRAINT IF EXISTS grade_records_assessment_type_check;

-- Đánh số lại các lần đánh giá quá trình cũ theo từng sinh viên/môn/năm học/học kỳ.
-- ORDER BY bảo đảm kết quả chuyển đổi ổn định và không phụ thuộc thứ tự trả về của DB.
WITH legacy_process AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY student_id, subject_id, school_year, semester
               ORDER BY
                   CASE assessment_type
                       WHEN 'ORAL' THEN 1
                       WHEN 'FIFTEEN_MIN' THEN 2
                       WHEN 'ONE_PERIOD' THEN 3
                       ELSE 4
                   END,
                   assessment_number,
                   id
           ) AS new_number
    FROM grade_records
    WHERE assessment_type IN ('ORAL', 'FIFTEEN_MIN', 'ONE_PERIOD')
)
UPDATE grade_records gr
SET assessment_type = 'PROCESS',
    assessment_number = lp.new_number
FROM legacy_process lp
WHERE gr.id = lp.id;

ALTER TABLE grade_records
    ADD CONSTRAINT ck_grade_records_assessment_type
    CHECK (assessment_type IN ('PROCESS', 'MIDTERM', 'FINAL'));

-- Lưu kết quả tổng kết và snapshot trọng số đã dùng.
-- Kết quả chỉ được tạo khi đã có đủ PROCESS, MIDTERM và FINAL.
CREATE TABLE grade_results (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id          BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id            BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id          BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    school_year         VARCHAR(9) NOT NULL,
    semester            SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    process_average     NUMERIC(8,4) NOT NULL CHECK (process_average BETWEEN 0 AND 10),
    midterm_score       NUMERIC(4,2) NOT NULL CHECK (midterm_score BETWEEN 0 AND 10),
    final_score         NUMERIC(4,2) NOT NULL CHECK (final_score BETWEEN 0 AND 10),
    process_weight      NUMERIC(5,2) NOT NULL CHECK (process_weight BETWEEN 0 AND 100),
    midterm_weight      NUMERIC(5,2) NOT NULL CHECK (midterm_weight BETWEEN 0 AND 100),
    final_weight        NUMERIC(5,2) NOT NULL CHECK (final_weight BETWEEN 0 AND 100),
    total_score         NUMERIC(4,2) NOT NULL CHECK (total_score BETWEEN 0 AND 10),
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_grade_result_student_subject_term
        UNIQUE (student_id, subject_id, school_year, semester),
    CONSTRAINT ck_grade_result_weights_sum
        CHECK (process_weight + midterm_weight + final_weight = 100.00)
);

CREATE INDEX idx_grade_results_class_subject_term
    ON grade_results(class_id, subject_id, school_year, semester);
CREATE INDEX idx_grade_results_student_term
    ON grade_results(student_id, school_year, semester);

-- Giữ nguyên điểm tổng kết cũ cho các bộ điểm đã đủ 5 cột.
-- Bộ trọng số snapshot 37.5/25/37.5 tương đương công thức cũ:
-- (TX1 + TX2 + TX3 + 2*GK + 3*CK) / 8.
INSERT INTO grade_results (
    student_id, class_id, subject_id, school_year, semester,
    process_average, midterm_score, final_score,
    process_weight, midterm_weight, final_weight, total_score
)
SELECT student_id, class_id, subject_id, school_year, semester,
       ROUND((tx1 + tx2 + tx3) / 3.0, 4),
       midterm_score, final_score,
       37.50, 25.00, 37.50,
       ROUND((tx1 + tx2 + tx3 + 2 * midterm_score + 3 * final_score) / 8.0, 2)
FROM legacy_grade_result_seed;
