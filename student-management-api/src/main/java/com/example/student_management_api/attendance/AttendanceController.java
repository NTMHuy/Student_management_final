package com.example.student_management_api.attendance;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public AttendanceController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record AttendanceRow(Long id, Long studentId, String studentCode, String fullName,
            String status, String note) {}
    public record AttendanceUpdate(Long studentId, Long classId, Long subjectId,
            LocalDate date, String session, String status, String note) {}

    @GetMapping
    public List<AttendanceRow> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam Long classId, @RequestParam LocalDate date,
            @RequestParam(defaultValue = "MORNING") String session,
            @RequestParam(required = false) Long subjectId) {
        Actor actor = actors.from(jwt);
        requireClassAccess(actor, classId, subjectId);
        return jdbc.query("""
            SELECT ar.id AS attendance_id, s.id AS student_id, s.student_code, s.full_name, ar.status, ar.note
            FROM students s
            LEFT JOIN attendance_records ar
              ON ar.student_id = s.id AND ar.attendance_date = ? AND ar.session = ?
            WHERE s.class_id = ? AND s.status = 'ACTIVE'
            ORDER BY s.student_code
            """, (rs, n) -> new AttendanceRow(
                (Long) rs.getObject("attendance_id"), rs.getLong("student_id"), rs.getString("student_code"),
                rs.getString("full_name"), rs.getString("status"), rs.getString("note")),
            date, session, classId);
    }

    @PutMapping
    @Transactional
    public AttendanceRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody AttendanceUpdate body) {
        Actor actor = actors.from(jwt);
        requireClassAccess(actor, body.classId(), body.subjectId());
        if (body.studentId() == null || body.date() == null ||
                !List.of("MORNING", "AFTERNOON").contains(body.session()) ||
                !List.of("PRESENT", "EXCUSED", "UNEXCUSED", "LATE").contains(body.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm danh không hợp lệ");
        }
        Integer belongs = jdbc.queryForObject(
            "SELECT count(*) FROM students WHERE id = ? AND class_id = ?",
            Integer.class, body.studentId(), body.classId());
        if (belongs == null || belongs == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học sinh không thuộc lớp");
        Long teacherId = actor.isAdmin() ? bodyTeacherId(actor, body.classId()) : actor.teacherId();
        jdbc.update("""
            INSERT INTO attendance_records(student_id, class_id, subject_id, teacher_id, attendance_date, session, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (student_id, attendance_date, session)
            DO UPDATE SET class_id=EXCLUDED.class_id, subject_id=EXCLUDED.subject_id,
              teacher_id=EXCLUDED.teacher_id, status=EXCLUDED.status, note=EXCLUDED.note, updated_at=now()
            """, body.studentId(), body.classId(), body.subjectId(), teacherId,
            body.date(), body.session(), body.status(), body.note());
        return jdbc.queryForObject("""
            SELECT ar.id, s.id AS student_id, s.student_code, s.full_name, ar.status, ar.note
            FROM attendance_records ar JOIN students s ON s.id=ar.student_id
            WHERE ar.student_id=? AND ar.attendance_date=? AND ar.session=?
            """, (rs, n) -> new AttendanceRow(rs.getLong("id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"), rs.getString("status"), rs.getString("note")),
            body.studentId(), body.date(), body.session());
    }

    private Long bodyTeacherId(Actor actor, Long classId) {
        Long id = jdbc.queryForObject("SELECT homeroom_teacher_id FROM classes WHERE id=?", Long.class, classId);
        if (id == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy phân công giáo viên chủ nhiệm trước khi điểm danh");
        return id;
    }

    private void requireClassAccess(Actor actor, Long classId, Long subjectId) {
        if (actor.isAdmin()) return;
        if (actor.teacherId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        Integer allowed = jdbc.queryForObject("""
            SELECT count(*) FROM classes c
            WHERE c.id=? AND (c.homeroom_teacher_id=? OR EXISTS (
              SELECT 1 FROM teacher_class_subjects tcs
              WHERE tcs.teacher_id=? AND tcs.class_id=c.id AND (? IS NULL OR tcs.subject_id=?)
            ))
            """, Integer.class, classId, actor.teacherId(), actor.teacherId(), subjectId, subjectId);
        if (allowed == null || allowed == 0) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công lớp/môn này");
    }
}
