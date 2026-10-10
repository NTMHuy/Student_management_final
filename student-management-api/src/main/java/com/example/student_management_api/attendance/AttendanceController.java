package com.example.student_management_api.attendance;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
        if (!List.of("MORNING", "AFTERNOON").contains(session)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Buổi điểm danh không hợp lệ");
        }
        return jdbc.query("""
            SELECT ar.id AS attendance_id, s.id AS student_id, s.student_code, s.full_name,
                   ar.status, ar.note
            FROM students s
            LEFT JOIN attendance_records ar
              ON ar.student_id = s.id
             AND ar.class_id = s.class_id
             AND ar.attendance_date = ?
             AND ar.session = ?
            WHERE s.class_id = ? AND s.status = 'ACTIVE'
            ORDER BY s.student_code
            """, (rs, n) -> new AttendanceRow(
                (Long) rs.getObject("attendance_id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                rs.getString("status"), rs.getString("note")),
            date, session, classId);
    }

    @PutMapping
    @Transactional
    public AttendanceRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody AttendanceUpdate body) {
        Actor actor = actors.from(jwt);
        if (body == null || body.studentId() == null || body.classId() == null || body.date() == null
                || !List.of("MORNING", "AFTERNOON").contains(body.session())
                || !List.of("PRESENT", "EXCUSED", "UNEXCUSED", "LATE").contains(body.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm danh không hợp lệ");
        }
        requireClassAccess(actor, body.classId(), body.subjectId());

        Integer belongs = jdbc.queryForObject(
            "SELECT count(*) FROM students WHERE id = ? AND class_id = ? AND status = 'ACTIVE'",
            Integer.class, body.studentId(), body.classId());
        if (belongs == null || belongs == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học sinh không thuộc lớp hoặc không còn hoạt động");
        }

        Long teacherId = actor.isAdmin()
                ? homeroomTeacherId(body.classId())
                : actor.teacherId();
        jdbc.update("""
            INSERT INTO attendance_records(student_id, class_id, subject_id, teacher_id,
                attendance_date, session, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (student_id, attendance_date, session)
            DO UPDATE SET class_id = EXCLUDED.class_id, subject_id = EXCLUDED.subject_id,
              teacher_id = EXCLUDED.teacher_id, status = EXCLUDED.status,
              note = EXCLUDED.note, updated_at = now()
            """, body.studentId(), body.classId(), body.subjectId(), teacherId,
            body.date(), body.session(), body.status(), body.note());

        return jdbc.queryForObject("""
            SELECT ar.id, s.id AS student_id, s.student_code, s.full_name, ar.status, ar.note
            FROM attendance_records ar
            JOIN students s ON s.id = ar.student_id AND s.class_id = ar.class_id
            WHERE ar.student_id = ? AND ar.class_id = ?
              AND ar.attendance_date = ? AND ar.session = ?
            """, (rs, n) -> new AttendanceRow(rs.getLong("id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                rs.getString("status"), rs.getString("note")),
            body.studentId(), body.classId(), body.date(), body.session());
    }

    private Long homeroomTeacherId(Long classId) {
        List<Long> ids = jdbc.query(
            "SELECT homeroom_teacher_id FROM classes WHERE id = ?",
            (rs, n) -> (Long) rs.getObject("homeroom_teacher_id"), classId);
        if (ids.isEmpty() || ids.get(0) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Hãy phân công giáo viên chủ nhiệm trước khi Admin ghi nhận điểm danh");
        }
        return ids.get(0);
    }

    private void requireClassAccess(Actor actor, Long classId, Long subjectId) {
        if (actor.isAdmin()) return;
        if (actor.teacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        }

        Integer allowed;
        if (subjectId == null) {
            allowed = jdbc.queryForObject("""
                SELECT count(*) FROM classes
                WHERE id = ? AND homeroom_teacher_id = ?
                """, Integer.class, classId, actor.teacherId());
        } else {
            allowed = jdbc.queryForObject("""
                SELECT count(*) FROM teacher_class_subjects
                WHERE teacher_id = ? AND class_id = ? AND subject_id = ?
                """, Integer.class, actor.teacherId(), classId, subjectId);
        }
        if (allowed == null || allowed == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không được phân công lớp hoặc môn học này");
        }
    }
}
