package com.example.student_management_api.teacher;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lớp/môn mà người dùng hiện tại được phép điểm danh / nhập điểm, để giao diện đổ vào ô chọn.
 * Admin: tất cả (restricted = false, pairs rỗng). Giáo viên: lớp chủ nhiệm hoặc được phân công;
 * pairs là các cặp (lớp, môn) được phân công, dùng cho nhập điểm.
 */
@RestController
@RequestMapping("/api/teaching-options")
public class TeachingOptionsController {

    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public TeachingOptionsController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record ClassOption(Long id, String name, Integer gradeLevel) {}

    public record SubjectOption(Long id, String code, String name) {}

    public record Pair(Long classId, Long subjectId) {}

    public record Options(boolean restricted, List<ClassOption> classes,
            List<SubjectOption> subjects, List<Pair> pairs) {}

    @GetMapping
    public Options options(@AuthenticationPrincipal Jwt jwt) {
        Actor actor = actors.from(jwt);
        if (actor.isAdmin()) {
            List<ClassOption> classes = jdbc.query("""
                SELECT id, class_name, grade_level FROM classes WHERE status = 'ACTIVE'
                ORDER BY grade_level, class_name
                """, (rs, n) -> new ClassOption(rs.getLong("id"), rs.getString("class_name"), rs.getInt("grade_level")));
            List<SubjectOption> subjects = jdbc.query("""
                SELECT id, subject_code, name FROM subjects WHERE status = 'ACTIVE' ORDER BY name
                """, (rs, n) -> new SubjectOption(rs.getLong("id"), rs.getString("subject_code"), rs.getString("name")));
            return new Options(false, classes, subjects, List.of());
        }
        Long teacherId = actor.teacherId();
        if (teacherId == null) {
            return new Options(true, List.of(), List.of(), List.of());
        }
        List<ClassOption> classes = jdbc.query("""
            SELECT c.id, c.class_name, c.grade_level FROM classes c
            WHERE c.homeroom_teacher_id = ? OR EXISTS (
              SELECT 1 FROM teacher_class_subjects tcs WHERE tcs.teacher_id = ? AND tcs.class_id = c.id)
            ORDER BY c.grade_level, c.class_name
            """, (rs, n) -> new ClassOption(rs.getLong("id"), rs.getString("class_name"), rs.getInt("grade_level")),
            teacherId, teacherId);
        List<SubjectOption> subjects = jdbc.query("""
            SELECT DISTINCT s.id, s.subject_code, s.name FROM subjects s
            JOIN teacher_class_subjects tcs ON tcs.subject_id = s.id
            WHERE tcs.teacher_id = ? ORDER BY s.name
            """, (rs, n) -> new SubjectOption(rs.getLong("id"), rs.getString("subject_code"), rs.getString("name")),
            teacherId);
        List<Pair> pairs = jdbc.query("""
            SELECT class_id, subject_id FROM teacher_class_subjects WHERE teacher_id = ?
            """, (rs, n) -> new Pair(rs.getLong("class_id"), rs.getLong("subject_id")), teacherId);
        return new Options(true, classes, subjects, pairs);
    }
}
