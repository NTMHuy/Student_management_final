package com.example.student_management_api.grade;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/grades")
public class GradeController {

    private static final List<String> TYPES = List.of("ORAL", "FIFTEEN_MIN", "ONE_PERIOD", "MIDTERM", "FINAL");
    private static final Pattern SCHOOL_YEAR = Pattern.compile("^\\d{4}-\\d{4}$");

    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public GradeController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record GradeRow(Long id, Long studentId, String studentCode, String fullName,
            Long subjectId, String schoolYear, Integer semester, String assessmentType,
            Integer assessmentNumber, BigDecimal score, String note) {}

    public record GradeUpdate(Long studentId, Long classId, Long subjectId, String schoolYear,
            Integer semester, String assessmentType, Integer assessmentNumber, BigDecimal score, String note) {}

    /** score = null nghĩa là xóa điểm ở ô đó. */
    public record BatchEntry(Long studentId, String assessmentType, Integer assessmentNumber,
            BigDecimal score, String note) {}

    public record BatchRequest(Long classId, Long subjectId, String schoolYear, Integer semester,
            List<BatchEntry> entries) {}

    /**
     * Bảng điểm của lớp theo môn/học kỳ. Mỗi học sinh có 1 dòng cho mỗi điểm đã nhập;
     * học sinh chưa có điểm nào vẫn xuất hiện với id/score = null.
     */
    @GetMapping
    public List<GradeRow> list(@AuthenticationPrincipal Jwt jwt, @RequestParam Long classId,
            @RequestParam Long subjectId, @RequestParam String schoolYear, @RequestParam Integer semester) {
        requireClassSubjectAccess(actors.from(jwt), classId, subjectId);
        validateTerm(schoolYear, semester);
        return jdbc.query("""
            SELECT gr.id, s.id AS student_id, s.student_code, s.full_name, gr.subject_id,
                   gr.school_year, gr.semester, gr.assessment_type, gr.assessment_number, gr.score, gr.note
            FROM students s LEFT JOIN grade_records gr
              ON gr.student_id=s.id AND gr.class_id=s.class_id AND gr.subject_id=? AND gr.school_year=? AND gr.semester=?
            WHERE s.class_id=? AND s.status='ACTIVE' ORDER BY s.student_code, gr.assessment_type, gr.assessment_number
            """, (rs,n) -> new GradeRow(nullableLong(rs, "id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                nullableLong(rs, "subject_id"), rs.getString("school_year"),
                nullableInt(rs, "semester"), rs.getString("assessment_type"),
                nullableInt(rs, "assessment_number"), rs.getBigDecimal("score"), rs.getString("note")),
            subjectId, schoolYear, semester, classId);
    }

    /** Nhập/sửa một điểm. */
    @PutMapping
    @Transactional
    public GradeRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody GradeUpdate body) {
        Actor actor = actors.from(jwt);
        if (body.classId() == null || body.subjectId() == null || body.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm số không hợp lệ");
        }
        requireClassSubjectAccess(actor, body.classId(), body.subjectId());
        validateTerm(body.schoolYear(), body.semester());
        validateCell(body.assessmentType(), body.assessmentNumber());
        BigDecimal score = normalizeScore(body.score());
        if (score == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập điểm từ 0 đến 10");
        }
        requireStudentInClass(body.studentId(), body.classId());
        Long teacherId = resolveTeacherId(actor, body.classId(), body.subjectId());
        save(body.studentId(), body.classId(), body.subjectId(), teacherId, body.schoolYear(),
                body.semester(), body.assessmentType(), body.assessmentNumber(), score, body.note());
        return jdbc.queryForObject("""
            SELECT gr.id,s.id AS student_id,s.student_code,s.full_name,gr.subject_id,gr.school_year,gr.semester,
                   gr.assessment_type,gr.assessment_number,gr.score,gr.note
            FROM grade_records gr JOIN students s ON s.id=gr.student_id
            WHERE gr.student_id=? AND gr.subject_id=? AND gr.school_year=? AND gr.semester=?
              AND gr.assessment_type=? AND gr.assessment_number=?
            """, (rs,n) -> new GradeRow(rs.getLong("id"),rs.getLong("student_id"),rs.getString("student_code"),
                rs.getString("full_name"),rs.getLong("subject_id"),rs.getString("school_year"),
                rs.getInt("semester"),rs.getString("assessment_type"),rs.getInt("assessment_number"),
                rs.getBigDecimal("score"),rs.getString("note")),
            body.studentId(),body.subjectId(),body.schoolYear(),body.semester(),body.assessmentType(),body.assessmentNumber());
    }

    /** Lưu cả bảng điểm trong một giao dịch (nút "Lưu bảng điểm"). Lỗi ở bất kỳ ô nào thì không lưu gì cả. */
    @PutMapping("/batch")
    @Transactional
    public void saveBatch(@AuthenticationPrincipal Jwt jwt, @RequestBody BatchRequest body) {
        Actor actor = actors.from(jwt);
        if (body.classId() == null || body.subjectId() == null || body.entries() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm số không hợp lệ");
        }
        requireClassSubjectAccess(actor, body.classId(), body.subjectId());
        validateTerm(body.schoolYear(), body.semester());
        Long teacherId = null;
        for (BatchEntry entry : body.entries()) {
            if (entry.studentId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu học sinh trong bảng điểm");
            }
            validateCell(entry.assessmentType(), entry.assessmentNumber());
            requireStudentInClass(entry.studentId(), body.classId());
            if (entry.score() == null) {
                jdbc.update("""
                    DELETE FROM grade_records
                    WHERE student_id=? AND subject_id=? AND school_year=? AND semester=?
                      AND assessment_type=? AND assessment_number=?
                    """, entry.studentId(), body.subjectId(), body.schoolYear(), body.semester(),
                    entry.assessmentType(), entry.assessmentNumber());
                continue;
            }
            BigDecimal score = normalizeScore(entry.score());
            if (score == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Điểm phải nằm trong khoảng từ 0 đến 10");
            }
            if (teacherId == null) {
                teacherId = resolveTeacherId(actor, body.classId(), body.subjectId());
            }
            save(entry.studentId(), body.classId(), body.subjectId(), teacherId, body.schoolYear(),
                    body.semester(), entry.assessmentType(), entry.assessmentNumber(), score, entry.note());
        }
    }

    /** Xóa một điểm (ô điểm bị xóa trống trên giao diện). */
    @DeleteMapping
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt,
            @RequestParam Long studentId, @RequestParam Long classId,
            @RequestParam Long subjectId, @RequestParam String schoolYear,
            @RequestParam Integer semester, @RequestParam String assessmentType,
            @RequestParam(defaultValue = "1") Integer assessmentNumber) {
        requireClassSubjectAccess(actors.from(jwt), classId, subjectId);
        validateTerm(schoolYear, semester);
        validateCell(assessmentType, assessmentNumber);
        requireStudentInClass(studentId, classId);
        jdbc.update("""
            DELETE FROM grade_records
            WHERE student_id=? AND class_id=? AND subject_id=? AND school_year=?
              AND semester=? AND assessment_type=? AND assessment_number=?
            """, studentId, classId, subjectId, schoolYear, semester, assessmentType, assessmentNumber);
    }

    // ---------------------------------------------------------------- helpers

    private static Long nullableLong(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static Integer nullableInt(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private void save(Long studentId, Long classId, Long subjectId, Long teacherId, String schoolYear,
            Integer semester, String type, Integer number, BigDecimal score, String note) {
        jdbc.update("""
            INSERT INTO grade_records(student_id,class_id,subject_id,teacher_id,school_year,semester,assessment_type,assessment_number,score,note)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (student_id,subject_id,school_year,semester,assessment_type,assessment_number)
            DO UPDATE SET class_id=EXCLUDED.class_id, teacher_id=EXCLUDED.teacher_id,
              score=EXCLUDED.score, note=EXCLUDED.note, updated_at=now()
            """, studentId, classId, subjectId, teacherId, schoolYear, semester, type, number, score,
            note == null || note.isBlank() ? null : note.trim());
    }

    private void validateTerm(String schoolYear, Integer semester) {
        if (schoolYear == null || !SCHOOL_YEAR.matcher(schoolYear).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Năm học không hợp lệ (ví dụ 2025-2026)");
        }
        if (semester == null || (semester != 1 && semester != 2)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học kỳ phải là 1 hoặc 2");
        }
    }

    private void validateCell(String type, Integer number) {
        if (type == null || !TYPES.contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại điểm không hợp lệ");
        }
        if (number == null || number < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lần kiểm tra không hợp lệ");
        }
    }

    /** Làm tròn 2 chữ số; trả null nếu ngoài khoảng 0..10 hoặc null. */
    private BigDecimal normalizeScore(BigDecimal score) {
        if (score == null) {
            return null;
        }
        BigDecimal rounded = score.setScale(2, RoundingMode.HALF_UP);
        if (rounded.compareTo(BigDecimal.ZERO) < 0 || rounded.compareTo(BigDecimal.TEN) > 0) {
            return null;
        }
        return rounded;
    }

    private void requireStudentInClass(Long studentId, Long classId) {
        Integer belongs = jdbc.queryForObject("SELECT count(*) FROM students WHERE id=? AND class_id=?",
            Integer.class, studentId, classId);
        if (belongs == null || belongs == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học sinh không thuộc lớp");
        }
    }

    /** Giáo viên: chính mình. Admin: giáo viên được phân công lớp/môn, rồi tổ trưởng môn, rồi GVCN. */
    private Long resolveTeacherId(Actor actor, Long classId, Long subjectId) {
        if (!actor.isAdmin()) {
            return actor.teacherId();
        }
        Long id = jdbc.queryForObject("""
            SELECT COALESCE(
              (SELECT tcs.teacher_id FROM teacher_class_subjects tcs
                WHERE tcs.class_id=? AND tcs.subject_id=? ORDER BY tcs.id LIMIT 1),
              (SELECT sub.head_teacher_id FROM subjects sub WHERE sub.id=?),
              (SELECT c.homeroom_teacher_id FROM classes c WHERE c.id=?))
            """, Long.class, classId, subjectId, subjectId, classId);
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Hãy phân công giáo viên dạy môn này ở lớp (hoặc tổ trưởng môn/GVCN) trước khi nhập điểm");
        }
        return id;
    }

    private void requireClassSubjectAccess(Actor actor, Long classId, Long subjectId) {
        if (actor.isAdmin()) {
            return;
        }
        if (actor.teacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        }
        Integer allowed = jdbc.queryForObject("""
            SELECT count(*) FROM teacher_class_subjects WHERE teacher_id=? AND class_id=? AND subject_id=?
            """, Integer.class, actor.teacherId(), classId, subjectId);
        if (allowed == null || allowed == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công môn học này ở lớp đã chọn");
        }
    }
}
