package com.example.student_management_api.grade;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/grades")
public class GradeController {
    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public GradeController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record ScoreValue(Long id, String componentType, Integer attemptNumber,
                             BigDecimal score, String note) {}
    public record GradeRow(Long enrollmentId, Long studentId, String studentCode,
            String fullName, String sectionCode, String subjectName,
            List<ScoreValue> scores, BigDecimal processWeight, BigDecimal midtermWeight,
            BigDecimal finalWeight, BigDecimal processAverage, BigDecimal midtermScore,
            BigDecimal finalScore, BigDecimal totalScore) {}
    public record BatchEntry(Long enrollmentId, String componentType, Integer attemptNumber,
                             BigDecimal score, String note) {}
    public record BatchRequest(Long courseSectionId, List<BatchEntry> entries) {}

    @GetMapping
    public List<GradeRow> list(@AuthenticationPrincipal Jwt jwt,
                               @RequestParam Long courseSectionId) {
        Actor actor = actors.from(jwt);
        requireSectionAccess(actor, courseSectionId);
        List<GradeRow> rows = jdbc.query("""
            SELECT e.id enrollment_id, s.id student_id, s.student_code, s.full_name,
                   cs.section_code, sub.name subject_name,
                   cs.process_weight, cs.midterm_weight, cs.final_weight,
                   r.process_average, r.midterm_score, r.final_score, r.total_score
            FROM enrollments e
            JOIN students s ON s.id=e.student_id
            JOIN course_sections cs ON cs.id=e.course_section_id
            JOIN subjects sub ON sub.id=cs.subject_id
            LEFT JOIN university_grade_results r ON r.enrollment_id=e.id
            WHERE e.course_section_id=? AND e.status IN ('REGISTERED','ACTIVE')
            ORDER BY s.student_code
            """, (rs,n) -> new GradeRow(
                rs.getLong("enrollment_id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                rs.getString("section_code"), rs.getString("subject_name"),
                scores(rs.getLong("enrollment_id")),
                rs.getBigDecimal("process_weight"), rs.getBigDecimal("midterm_weight"),
                rs.getBigDecimal("final_weight"), rs.getBigDecimal("process_average"),
                rs.getBigDecimal("midterm_score"), rs.getBigDecimal("final_score"),
                rs.getBigDecimal("total_score")), courseSectionId);
        return rows;
    }

    @PutMapping("/batch")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveBatch(@AuthenticationPrincipal Jwt jwt, @RequestBody BatchRequest body) {
        Actor actor = actors.from(jwt);
        if (body == null || body.courseSectionId() == null || body.entries() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu bảng điểm không hợp lệ");
        }
        requireSectionAccess(actor, body.courseSectionId());
        for (BatchEntry entry : body.entries()) {
            if (entry.enrollmentId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin đăng ký học phần");
            }
            validateComponent(entry.componentType(), entry.attemptNumber());
            Integer belongs = jdbc.queryForObject("""
                SELECT count(*) FROM enrollments
                WHERE id=? AND course_section_id=? AND status IN ('REGISTERED','ACTIVE')
                """, Integer.class, entry.enrollmentId(), body.courseSectionId());
            if (belongs == null || belongs == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sinh viên không thuộc lớp học phần hoặc đăng ký không còn hiệu lực");
            }
            if (entry.score() == null) {
                jdbc.update("""
                    DELETE FROM university_grade_records
                    WHERE enrollment_id=? AND component_type=? AND attempt_number=?
                    """, entry.enrollmentId(), entry.componentType(), entry.attemptNumber());
            } else {
                BigDecimal score = entry.score().setScale(2, RoundingMode.HALF_UP);
                if (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(BigDecimal.TEN) > 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Điểm phải nằm trong khoảng 0 đến 10");
                }
                jdbc.update("""
                    INSERT INTO university_grade_records
                      (enrollment_id,component_type,attempt_number,score,note,recorded_by)
                    VALUES (?,?,?,?,?,?)
                    ON CONFLICT (enrollment_id,component_type,attempt_number)
                    DO UPDATE SET score=EXCLUDED.score,note=EXCLUDED.note,
                      recorded_by=EXCLUDED.recorded_by,updated_at=now()
                    """, entry.enrollmentId(), entry.componentType(), entry.attemptNumber(),
                    score, entry.note()==null||entry.note().isBlank()?null:entry.note().trim(), actor.userId());
                jdbc.update("""
                    INSERT INTO university_grade_results
                      (enrollment_id,process_weight_snapshot,midterm_weight_snapshot,final_weight_snapshot)
                    SELECT e.id,cs.process_weight,cs.midterm_weight,cs.final_weight
                    FROM enrollments e JOIN course_sections cs ON cs.id=e.course_section_id
                    WHERE e.id=? ON CONFLICT (enrollment_id) DO NOTHING
                    """, entry.enrollmentId());
            }
            recalculate(entry.enrollmentId());
        }
    }

    private List<ScoreValue> scores(Long enrollmentId) {
        return jdbc.query("""
            SELECT id,component_type,attempt_number,score,note
            FROM university_grade_records WHERE enrollment_id=?
            ORDER BY CASE component_type WHEN 'PROCESS' THEN 1 WHEN 'MIDTERM' THEN 2 ELSE 3 END,attempt_number
            """, (rs,n) -> new ScoreValue(rs.getLong("id"),rs.getString("component_type"),
                rs.getInt("attempt_number"),rs.getBigDecimal("score"),rs.getString("note")), enrollmentId);
    }

    private void recalculate(Long enrollmentId) {
        jdbc.update("""
            UPDATE university_grade_results r SET
              process_average=(SELECT round(avg(score),2) FROM university_grade_records
                               WHERE enrollment_id=? AND component_type='PROCESS'),
              midterm_score=(SELECT score FROM university_grade_records
                             WHERE enrollment_id=? AND component_type='MIDTERM' AND attempt_number=1),
              final_score=(SELECT score FROM university_grade_records
                           WHERE enrollment_id=? AND component_type='FINAL' AND attempt_number=1),
              calculated_at=now(),updated_at=now()
            WHERE r.enrollment_id=?
            """, enrollmentId,enrollmentId,enrollmentId,enrollmentId);
        jdbc.update("""
            UPDATE university_grade_results SET total_score=CASE
              WHEN process_average IS NOT NULL AND midterm_score IS NOT NULL AND final_score IS NOT NULL
              THEN round((process_average*process_weight_snapshot
                        +midterm_score*midterm_weight_snapshot
                        +final_score*final_weight_snapshot)/100,2)
              ELSE NULL END,
              updated_at=now()
            WHERE enrollment_id=?
            """, enrollmentId);
    }

    private void validateComponent(String type, Integer attempt) {
        if (type == null || !List.of("PROCESS","MIDTERM","FINAL").contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thành phần điểm không hợp lệ");
        }
        if (attempt == null || attempt < 1 || (!"PROCESS".equals(type) && attempt != 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Lần nhập điểm không hợp lệ");
        }
    }

    private void requireSectionAccess(Actor actor, Long sectionId) {
        if (actor.isAdmin()) return;
        if (actor.teacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tài khoản chưa gắn hồ sơ giảng viên");
        }
        Integer allowed = jdbc.queryForObject("""
            SELECT count(*) FROM teaching_assignments WHERE teacher_id=? AND course_section_id=?
            """, Integer.class, actor.teacherId(), sectionId);
        if (allowed == null || allowed == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Bạn không được phân công lớp học phần này");
        }
    }
}
