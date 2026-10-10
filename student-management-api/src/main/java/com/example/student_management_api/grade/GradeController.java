package com.example.student_management_api.grade;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.math.BigDecimal;
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

    public record GradeRow(Long id, Long studentId, String studentCode, String fullName,
            Long subjectId, String schoolYear, Integer semester, String assessmentType,
            Integer assessmentNumber, BigDecimal score, String note) {}
    public record GradeUpdate(Long studentId, Long classId, Long subjectId, String schoolYear,
            Integer semester, String assessmentType, Integer assessmentNumber, BigDecimal score, String note) {}

    @GetMapping
    public List<GradeRow> list(@AuthenticationPrincipal Jwt jwt, @RequestParam Long classId,
            @RequestParam Long subjectId, @RequestParam String schoolYear, @RequestParam Integer semester) {
        requireClassSubjectAccess(actors.from(jwt), classId, subjectId);
        return jdbc.query("""
            SELECT gr.id, s.id AS student_id, s.student_code, s.full_name, gr.subject_id,
                   gr.school_year, gr.semester, gr.assessment_type, gr.assessment_number, gr.score, gr.note
            FROM students s LEFT JOIN grade_records gr
              ON gr.student_id=s.id AND gr.subject_id=? AND gr.school_year=? AND gr.semester=?
            WHERE s.class_id=? AND s.status='ACTIVE' ORDER BY s.student_code, gr.assessment_type, gr.assessment_number
            """, (rs,n) -> new GradeRow((Long) rs.getObject("id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                (Long) rs.getObject("subject_id"), rs.getString("school_year"),
                (Integer) rs.getObject("semester"), rs.getString("assessment_type"),
                (Integer) rs.getObject("assessment_number"), rs.getBigDecimal("score"), rs.getString("note")),
            subjectId, schoolYear, semester, classId);
    }

    @PutMapping
    @Transactional
    public GradeRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody GradeUpdate body) {
        Actor actor = actors.from(jwt);
        requireClassSubjectAccess(actor, body.classId(), body.subjectId());
        if (body.studentId() == null || body.schoolYear() == null || body.schoolYear().isBlank()
                || body.semester() == null || !List.of(1,2).contains(body.semester())
                || body.assessmentType() == null || !List.of("ORAL","FIFTEEN_MIN","ONE_PERIOD","MIDTERM","FINAL").contains(body.assessmentType())
                || body.assessmentNumber() == null || body.assessmentNumber() < 1
                || body.score() == null || body.score().compareTo(BigDecimal.ZERO) < 0
                || body.score().compareTo(BigDecimal.TEN) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm số không hợp lệ");
        }
        Integer belongs = jdbc.queryForObject("SELECT count(*) FROM students WHERE id=? AND class_id=?",
            Integer.class, body.studentId(), body.classId());
        if (belongs == null || belongs == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học sinh không thuộc lớp");
        Long teacherId = actor.teacherId();
        if (actor.isAdmin()) {
            teacherId = jdbc.queryForObject("SELECT head_teacher_id FROM subjects WHERE id=?", Long.class, body.subjectId());
            if (teacherId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Môn học chưa có tổ trưởng/giáo viên phụ trách");
        }
        jdbc.update("""
            INSERT INTO grade_records(student_id,class_id,subject_id,teacher_id,school_year,semester,assessment_type,assessment_number,score,note)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (student_id,subject_id,school_year,semester,assessment_type,assessment_number)
            DO UPDATE SET class_id=EXCLUDED.class_id, teacher_id=EXCLUDED.teacher_id,
              score=EXCLUDED.score, note=EXCLUDED.note, updated_at=now()
            """, body.studentId(), body.classId(), body.subjectId(), teacherId, body.schoolYear(),
            body.semester(), body.assessmentType(), body.assessmentNumber(), body.score(), body.note());
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

    private void requireClassSubjectAccess(Actor actor, Long classId, Long subjectId) {
        if (actor.isAdmin()) return;
        if (actor.teacherId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        Integer allowed = jdbc.queryForObject("""
            SELECT count(*) FROM teacher_class_subjects WHERE teacher_id=? AND class_id=? AND subject_id=?
            """, Integer.class, actor.teacherId(), classId, subjectId);
        if (allowed == null || allowed == 0) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công môn học này ở lớp đã chọn");
    }
}
