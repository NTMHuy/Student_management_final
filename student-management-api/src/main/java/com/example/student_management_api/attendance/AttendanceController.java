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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Attendance for university course sessions and student enrollments. */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private static final ZoneId SCHOOL_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<String> STATUSES = List.of("PRESENT", "EXCUSED", "UNEXCUSED", "LATE");

    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public AttendanceController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record AttendanceRow(Long id, Long enrollmentId, Long studentId,
            String studentCode, String fullName, String status, String note) {}
    public record AttendanceEntry(Long enrollmentId, String status, String note) {}
    public record BatchRequest(Long courseSessionId, List<AttendanceEntry> entries) {}
    public record AttendanceUpdate(Long courseSessionId, Long enrollmentId, String status, String note) {}
    public record HistoryRow(Long id, String sessionDate, String startTime, String endTime,
            Long courseSessionId, Long courseSectionId, String sectionCode, String sectionName,
            String subjectCode, String subjectName, Long enrollmentId, Long studentId,
            String studentCode, String fullName, String status, String note, String teacherName) {}
    public record WarningRow(Long studentId, String studentCode, String fullName,
            String studentClassName, int totalMissed, int unexcused, int excused) {}

    /** Enrollment roster and attendance state for one scheduled course session. */
    @GetMapping
    public List<AttendanceRow> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam Long courseSessionId) {
        Actor actor = actors.from(jwt);
        requireSessionAccess(actor, courseSessionId);
        return jdbc.query("""
            SELECT ar.id, e.id AS enrollment_id, s.id AS student_id,
                   s.student_code, s.full_name, ar.status, ar.note
            FROM course_sessions cs
            JOIN enrollments e ON e.course_section_id = cs.course_section_id
            JOIN students s ON s.id = e.student_id
            LEFT JOIN university_attendance_records ar
              ON ar.course_session_id = cs.id AND ar.enrollment_id = e.id
            WHERE cs.id = ?
              AND e.status IN ('REGISTERED', 'ACTIVE')
              AND s.status = 'ACTIVE'
            ORDER BY s.student_code
            """, (rs, n) -> new AttendanceRow(nullableLong(rs, "id"),
                rs.getLong("enrollment_id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                rs.getString("status"), rs.getString("note")), courseSessionId);
    }

    @PutMapping
    @Transactional
    public AttendanceRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody AttendanceUpdate body) {
        Actor actor = actors.from(jwt);
        validateRequest(body == null ? null : body.courseSessionId(),
                body == null ? null : body.enrollmentId(), body == null ? null : body.status());
        requireSessionAccess(actor, body.courseSessionId());
        save(actor, body.courseSessionId(), body.enrollmentId(), body.status(), body.note());
        return findRecord(body.courseSessionId(), body.enrollmentId());
    }

    @PutMapping("/batch")
    @Transactional
    public List<AttendanceRow> saveBatch(@AuthenticationPrincipal Jwt jwt, @RequestBody BatchRequest body) {
        Actor actor = actors.from(jwt);
        if (body == null || body.courseSessionId() == null || body.entries() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin điểm danh không hợp lệ");
        }
        requireSessionAccess(actor, body.courseSessionId());
        for (AttendanceEntry entry : body.entries()) {
            validateRequest(body.courseSessionId(), entry == null ? null : entry.enrollmentId(),
                    entry == null ? null : entry.status());
            save(actor, body.courseSessionId(), entry.enrollmentId(), entry.status(), entry.note());
        }
        return list(jwt, body.courseSessionId());
    }

    @GetMapping("/history")
    public List<HistoryRow> history(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long courseSectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        Actor actor = actors.from(jwt);
        if (from != null && to != null && from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khoảng ngày không hợp lệ");
        }
        StringBuilder sql = new StringBuilder("""
            SELECT ar.id, cs.session_date, cs.start_time, cs.end_time, cs.id AS course_session_id,
                   sec.id AS course_section_id, sec.section_code, sec.section_name,
                   sub.subject_code, sub.name AS subject_name, e.id AS enrollment_id,
                   s.id AS student_id, s.student_code, s.full_name, ar.status, ar.note,
                   t.full_name AS teacher_name
            FROM university_attendance_records ar
            JOIN course_sessions cs ON cs.id = ar.course_session_id
            JOIN course_sections sec ON sec.id = cs.course_section_id
            JOIN subjects sub ON sub.id = sec.subject_id
            JOIN enrollments e ON e.id = ar.enrollment_id
            JOIN students s ON s.id = e.student_id
            LEFT JOIN users u ON u.id = ar.recorded_by
            LEFT JOIN teachers t ON t.id = u.teacher_id
            WHERE 1 = 1
            """);
        List<Object> params = new ArrayList<>();
        appendTeacherScope(actor, sql, params, "sec.id");
        if (courseSectionId != null) { sql.append(" AND sec.id = ?"); params.add(courseSectionId); }
        if (from != null) { sql.append(" AND cs.session_date >= ?"); params.add(from); }
        if (to != null) { sql.append(" AND cs.session_date <= ?"); params.add(to); }
        if (status != null && !status.isBlank()) {
            String normalized = status.trim().toUpperCase();
            validateStatus(normalized);
            sql.append(" AND ar.status = ?"); params.add(normalized);
        }
        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim().toLowerCase() + "%";
            sql.append(" AND (lower(s.full_name) LIKE ? OR lower(s.student_code) LIKE ? OR lower(sec.section_code) LIKE ?)");
            params.add(like); params.add(like); params.add(like);
        }
        sql.append(" ORDER BY cs.session_date DESC, cs.start_time DESC, s.student_code LIMIT 500");
        return jdbc.query(sql.toString(), (rs, n) -> new HistoryRow(
            rs.getLong("id"), rs.getDate("session_date").toLocalDate().toString(),
            rs.getTime("start_time").toLocalTime().toString(), rs.getTime("end_time").toLocalTime().toString(),
            rs.getLong("course_session_id"), rs.getLong("course_section_id"),
            rs.getString("section_code"), rs.getString("section_name"),
            rs.getString("subject_code"), rs.getString("subject_name"),
            rs.getLong("enrollment_id"), rs.getLong("student_id"), rs.getString("student_code"),
            rs.getString("full_name"), rs.getString("status"), rs.getString("note"),
            rs.getString("teacher_name")), params.toArray());
    }

    /** Simple absence summary for the recent period; excused and unexcused absences are counted. */
    @GetMapping("/warnings")
    public List<WarningRow> warnings(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "3") int minAbsences) {
        Actor actor = actors.from(jwt);
        int safeDays = Math.max(1, Math.min(days, 365));
        int safeMin = Math.max(1, minAbsences);
        StringBuilder sql = new StringBuilder("""
            SELECT s.id, s.student_code, s.full_name, sc.class_name,
                   count(*) FILTER (WHERE ar.status IN ('EXCUSED','UNEXCUSED')) AS missed,
                   count(*) FILTER (WHERE ar.status = 'UNEXCUSED') AS unexcused,
                   count(*) FILTER (WHERE ar.status = 'EXCUSED') AS excused
            FROM university_attendance_records ar
            JOIN course_sessions cs ON cs.id = ar.course_session_id
            JOIN course_sections sec ON sec.id = cs.course_section_id
            JOIN enrollments e ON e.id = ar.enrollment_id
            JOIN students s ON s.id = e.student_id
            LEFT JOIN student_classes sc ON sc.id = s.student_class_id
            WHERE cs.session_date >= ?
            """);
        List<Object> params = new ArrayList<>();
        params.add(LocalDate.now(SCHOOL_ZONE).minusDays(safeDays));
        appendTeacherScope(actor, sql, params, "sec.id");
        sql.append("""
            GROUP BY s.id, s.student_code, s.full_name, sc.class_name
            HAVING count(*) FILTER (WHERE ar.status IN ('EXCUSED','UNEXCUSED')) >= ?
            ORDER BY unexcused DESC, missed DESC, s.student_code LIMIT 20
            """);
        params.add(safeMin);
        return jdbc.query(sql.toString(), (rs, n) -> new WarningRow(
            rs.getLong("id"), rs.getString("student_code"), rs.getString("full_name"),
            rs.getString("class_name"), rs.getInt("missed"), rs.getInt("unexcused"),
            rs.getInt("excused")), params.toArray());
    }

    private void validateRequest(Long sessionId, Long enrollmentId, String status) {
        if (sessionId == null || enrollmentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu buổi học hoặc sinh viên đăng ký");
        }
        validateStatus(status);
    }

    private void validateStatus(String status) {
        if (status == null || !STATUSES.contains(status.trim().toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái điểm danh không hợp lệ");
        }
    }

    private void requireSessionAccess(Actor actor, Long sessionId) {
        String scope = actor.isAdmin() ? "" : """
            AND EXISTS (SELECT 1 FROM teaching_assignments ta
                        WHERE ta.course_section_id = cs.course_section_id AND ta.teacher_id = ?)
            """;
        String sql = "SELECT count(*) FROM course_sessions cs WHERE cs.id = ? " + scope;
        Integer allowed = actor.isAdmin()
            ? jdbc.queryForObject(sql, Integer.class, sessionId)
            : actor.teacherId() == null ? 0
            : jdbc.queryForObject(sql, Integer.class, sessionId, actor.teacherId());
        if (allowed == null || allowed == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công buổi học này");
        }
    }

    private void appendTeacherScope(Actor actor, StringBuilder sql, List<Object> params, String sectionAlias) {
        if (actor.isAdmin()) return;
        if (actor.teacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa gắn hồ sơ giáo viên");
        }
        sql.append(" AND EXISTS (SELECT 1 FROM teaching_assignments ta WHERE ta.course_section_id = ")
            .append(sectionAlias).append(" AND ta.teacher_id = ?)");
        params.add(actor.teacherId());
    }

    private void save(Actor actor, Long sessionId, Long enrollmentId, String status, String note) {
        Integer valid = jdbc.queryForObject("""
            SELECT count(*) FROM course_sessions cs
            JOIN enrollments e ON e.course_section_id = cs.course_section_id
            WHERE cs.id = ? AND e.id = ? AND e.status IN ('REGISTERED','ACTIVE')
            """, Integer.class, sessionId, enrollmentId);
        if (valid == null || valid == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Sinh viên không thuộc lớp học phần của buổi học hoặc không còn đăng ký");
        }
        jdbc.update("""
            INSERT INTO university_attendance_records
                (course_session_id, enrollment_id, status, note, recorded_by)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (course_session_id, enrollment_id)
            DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note,
                          recorded_by = EXCLUDED.recorded_by, updated_at = now()
            """, sessionId, enrollmentId, status.trim().toUpperCase(), blankToNull(note), actor.userId());
    }

    private AttendanceRow findRecord(Long sessionId, Long enrollmentId) {
        return jdbc.queryForObject("""
            SELECT ar.id, e.id AS enrollment_id, s.id AS student_id, s.student_code,
                   s.full_name, ar.status, ar.note
            FROM university_attendance_records ar
            JOIN enrollments e ON e.id = ar.enrollment_id
            JOIN students s ON s.id = e.student_id
            WHERE ar.course_session_id = ? AND ar.enrollment_id = ?
            """, (rs, n) -> new AttendanceRow(rs.getLong("id"), rs.getLong("enrollment_id"),
                rs.getLong("student_id"), rs.getString("student_code"), rs.getString("full_name"),
                rs.getString("status"), rs.getString("note")), sessionId, enrollmentId);
    }

    private static Long nullableLong(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
