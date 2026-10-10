package com.example.student_management_api.attendance;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private static final List<String> SESSIONS = List.of("MORNING", "AFTERNOON");
    private static final List<String> STATUSES = List.of("PRESENT", "EXCUSED", "UNEXCUSED", "LATE");
    private static final ZoneId SCHOOL_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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

    public record BatchEntry(Long studentId, String status, String note) {}

    public record BatchRequest(Long classId, Long subjectId, LocalDate date, String session,
            List<BatchEntry> entries) {}

    public record HistoryRow(Long id, String date, String session, Long classId, String className,
            String subjectName, String studentCode, String fullName, String status, String note,
            String teacherName) {}

    public record WarningRow(Long studentId, String studentCode, String fullName, String className,
            int totalMissed, int unexcused, int excused) {}

    /** Danh sách học sinh của lớp kèm trạng thái điểm danh của buổi (status = null nếu chưa điểm danh). */
    @GetMapping
    public List<AttendanceRow> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam Long classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "MORNING") String session,
            @RequestParam(required = false) Long subjectId) {
        Actor actor = actors.from(jwt);
        requireClassAccess(actor, classId, subjectId);
        if (!SESSIONS.contains(session)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Buổi học không hợp lệ");
        }
        return jdbc.query("""
            SELECT ar.id AS attendance_id, s.id AS student_id, s.student_code, s.full_name, ar.status, ar.note
            FROM students s
            LEFT JOIN attendance_records ar
              ON ar.student_id = s.id AND ar.class_id = s.class_id
             AND ar.attendance_date = ? AND ar.session = ?
            WHERE s.class_id = ? AND s.status = 'ACTIVE'
            ORDER BY s.student_code
            """, (rs, n) -> new AttendanceRow(
                nullableLong(rs, "attendance_id"), rs.getLong("student_id"), rs.getString("student_code"),
                rs.getString("full_name"), rs.getString("status"), rs.getString("note")),
            date, session, classId);
    }

    /** Điểm danh một học sinh. */
    @PutMapping
    @Transactional
    public AttendanceRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody AttendanceUpdate body) {
        Actor actor = actors.from(jwt);
        if (body.classId() == null || body.studentId() == null || body.date() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm danh không hợp lệ");
        }
        requireClassAccess(actor, body.classId(), body.subjectId());
        validateSlot(body.date(), body.session());
        validateStatus(body.status());
        requireStudentInClass(body.studentId(), body.classId());
        Long teacherId = resolveTeacherId(actor, body.classId(), body.subjectId());
        save(body.studentId(), body.classId(), body.subjectId(), teacherId,
                body.date(), body.session(), body.status(), body.note());
        return jdbc.queryForObject("""
            SELECT ar.id, s.id AS student_id, s.student_code, s.full_name, ar.status, ar.note
            FROM attendance_records ar JOIN students s ON s.id=ar.student_id
            WHERE ar.student_id=? AND ar.attendance_date=? AND ar.session=?
            """, (rs, n) -> new AttendanceRow(rs.getLong("id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"), rs.getString("status"), rs.getString("note")),
            body.studentId(), body.date(), body.session());
    }

    /** Lưu điểm danh cả lớp trong một giao dịch (nút "Lưu điểm danh"). */
    @PutMapping("/batch")
    @Transactional
    public List<AttendanceRow> saveBatch(@AuthenticationPrincipal Jwt jwt, @RequestBody BatchRequest body) {
        Actor actor = actors.from(jwt);
        if (body.classId() == null || body.date() == null || body.entries() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm danh không hợp lệ");
        }
        requireClassAccess(actor, body.classId(), body.subjectId());
        validateSlot(body.date(), body.session());
        Long teacherId = resolveTeacherId(actor, body.classId(), body.subjectId());
        for (BatchEntry entry : body.entries()) {
            if (entry.studentId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu học sinh trong danh sách điểm danh");
            }
            validateStatus(entry.status());
            requireStudentInClass(entry.studentId(), body.classId());
            save(entry.studentId(), body.classId(), body.subjectId(), teacherId,
                    body.date(), body.session(), entry.status(), entry.note());
        }
        return list(jwt, body.classId(), body.date(), body.session(), body.subjectId());
    }

    /** Lịch sử điểm danh (mới nhất trước). Giáo viên chỉ thấy lớp mình chủ nhiệm hoặc được phân công. */
    @GetMapping("/history")
    public List<HistoryRow> history(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        Actor actor = actors.from(jwt);
        StringBuilder sql = new StringBuilder("""
            SELECT ar.id, ar.attendance_date, ar.session, c.id AS class_id, c.class_name,
                   sub.name AS subject_name, s.student_code, s.full_name, ar.status, ar.note,
                   t.full_name AS teacher_name
            FROM attendance_records ar
            JOIN students s ON s.id = ar.student_id
            JOIN classes c ON c.id = ar.class_id
            JOIN teachers t ON t.id = ar.teacher_id
            LEFT JOIN subjects sub ON sub.id = ar.subject_id
            WHERE 1 = 1
            """);
        List<Object> params = new ArrayList<>();
        appendTeacherScope(actor, sql, params);
        if (classId != null) {
            sql.append(" AND ar.class_id = ?");
            params.add(classId);
        }
        if (from != null) {
            sql.append(" AND ar.attendance_date >= ?");
            params.add(from);
        }
        if (to != null) {
            sql.append(" AND ar.attendance_date <= ?");
            params.add(to);
        }
        if (status != null && !status.isBlank()) {
            String normalized = status.trim().toUpperCase();
            if (!STATUSES.contains(normalized)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
            }
            sql.append(" AND ar.status = ?");
            params.add(normalized);
        }
        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim().toLowerCase() + "%";
            sql.append(" AND (lower(s.full_name) LIKE ? OR lower(s.student_code) LIKE ? OR lower(t.full_name) LIKE ?)");
            params.add(like);
            params.add(like);
            params.add(like);
        }
        sql.append(" ORDER BY ar.attendance_date DESC, ar.session DESC, s.student_code LIMIT 500");
        return jdbc.query(sql.toString(), (rs, n) -> new HistoryRow(
                rs.getLong("id"), rs.getDate("attendance_date").toLocalDate().toString(), rs.getString("session"),
                rs.getLong("class_id"), rs.getString("class_name"), rs.getString("subject_name"),
                rs.getString("student_code"), rs.getString("full_name"), rs.getString("status"),
                rs.getString("note"), rs.getString("teacher_name")),
            params.toArray());
    }

    /** Học sinh vắng nhiều (mặc định: từ 3 buổi trở lên trong 30 ngày gần nhất). */
    @GetMapping("/warnings")
    public List<WarningRow> warnings(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long classId,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "3") int minAbsences) {
        Actor actor = actors.from(jwt);
        int safeDays = Math.max(1, Math.min(days, 365));
        int safeMin = Math.max(1, minAbsences);
        StringBuilder sql = new StringBuilder("""
            SELECT s.id, s.student_code, s.full_name, c.class_name,
                   count(*) FILTER (WHERE ar.status IN ('EXCUSED', 'UNEXCUSED')) AS missed,
                   count(*) FILTER (WHERE ar.status = 'UNEXCUSED') AS unexcused,
                   count(*) FILTER (WHERE ar.status = 'EXCUSED') AS excused
            FROM attendance_records ar
            JOIN students s ON s.id = ar.student_id
            JOIN classes c ON c.id = s.class_id
            WHERE ar.attendance_date >= ?
            """);
        List<Object> params = new ArrayList<>();
        params.add(LocalDate.now(SCHOOL_ZONE).minusDays(safeDays));
        appendTeacherScope(actor, sql, params);
        if (classId != null) {
            sql.append(" AND ar.class_id = ?");
            params.add(classId);
        }
        sql.append("""
             GROUP BY s.id, s.student_code, s.full_name, c.class_name
             HAVING count(*) FILTER (WHERE ar.status IN ('EXCUSED', 'UNEXCUSED')) >= ?
             ORDER BY unexcused DESC, missed DESC, s.student_code
             LIMIT 20
            """);
        params.add(safeMin);
        return jdbc.query(sql.toString(), (rs, n) -> new WarningRow(
                rs.getLong("id"), rs.getString("student_code"), rs.getString("full_name"),
                rs.getString("class_name"), rs.getInt("missed"), rs.getInt("unexcused"), rs.getInt("excused")),
            params.toArray());
    }

    // ---------------------------------------------------------------- helpers

    private void save(Long studentId, Long classId, Long subjectId, Long teacherId,
            LocalDate date, String session, String status, String note) {
        jdbc.update("""
            INSERT INTO attendance_records(student_id, class_id, subject_id, teacher_id, attendance_date, session, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (student_id, attendance_date, session)
            DO UPDATE SET class_id=EXCLUDED.class_id, subject_id=EXCLUDED.subject_id,
              teacher_id=EXCLUDED.teacher_id, status=EXCLUDED.status, note=EXCLUDED.note, updated_at=now()
            """, studentId, classId, subjectId, teacherId, date, session, status, blankToNull(note));
    }

    private static Long nullableLong(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void validateSlot(LocalDate date, String session) {
        if (session == null || !SESSIONS.contains(session)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Buổi học không hợp lệ");
        }
        if (date.isAfter(LocalDate.now(SCHOOL_ZONE))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể điểm danh cho ngày trong tương lai");
        }
    }

    private void validateStatus(String status) {
        if (status == null || !STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái điểm danh không hợp lệ");
        }
    }

    private void requireStudentInClass(Long studentId, Long classId) {
        Integer belongs = jdbc.queryForObject(
            "SELECT count(*) FROM students WHERE id = ? AND class_id = ?",
            Integer.class, studentId, classId);
        if (belongs == null || belongs == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Học sinh không thuộc lớp");
        }
    }

    /** Giáo viên: chính mình. Admin: giáo viên được phân công lớp (và môn), nếu không có thì GVCN. */
    private Long resolveTeacherId(Actor actor, Long classId, Long subjectId) {
        if (!actor.isAdmin()) {
            return actor.teacherId();
        }
        Long id = jdbc.queryForObject("""
            SELECT COALESCE(
              (SELECT tcs.teacher_id FROM teacher_class_subjects tcs
                WHERE tcs.class_id = ? AND (CAST(? AS BIGINT) IS NULL OR tcs.subject_id = ?)
                ORDER BY tcs.id LIMIT 1),
              (SELECT c.homeroom_teacher_id FROM classes c WHERE c.id = ?))
            """, Long.class, classId, subjectId, subjectId, classId);
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Lớp chưa có giáo viên chủ nhiệm hoặc giáo viên được phân công để ghi nhận điểm danh");
        }
        return id;
    }

    private void appendTeacherScope(Actor actor, StringBuilder sql, List<Object> params) {
        if (actor.isAdmin()) {
            return;
        }
        if (actor.teacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        }
        sql.append("""
             AND (c.homeroom_teacher_id = ? OR EXISTS (
                   SELECT 1 FROM teacher_class_subjects tcs
                   WHERE tcs.teacher_id = ? AND tcs.class_id = c.id))
            """);
        params.add(actor.teacherId());
        params.add(actor.teacherId());
    }

    private void requireClassAccess(Actor actor, Long classId, Long subjectId) {
        if (actor.isAdmin()) {
            return;
        }
        if (actor.teacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        }
        Integer allowed = jdbc.queryForObject("""
            SELECT count(*) FROM classes c
            WHERE c.id = ? AND (c.homeroom_teacher_id = ? OR EXISTS (
              SELECT 1 FROM teacher_class_subjects tcs
              WHERE tcs.teacher_id = ? AND tcs.class_id = c.id
                AND (CAST(? AS BIGINT) IS NULL OR tcs.subject_id = ?)
            ))
            """, Integer.class, classId, actor.teacherId(), actor.teacherId(), subjectId, subjectId);
        if (allowed == null || allowed == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công lớp/môn này");
        }
    }
}
