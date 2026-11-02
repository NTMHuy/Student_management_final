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
 * Course-section options available for attendance and grade operations.
 * ADMIN sees all non-cancelled sections; TEACHER sees only assigned sections.
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

    public record CourseSectionOption(
            Long id,
            String sectionCode,
            String sectionName,
            Long subjectId,
            String subjectCode,
            String subjectName,
            Long semesterId,
            String semesterName,
            String status) {}

    public record Options(boolean restricted, List<CourseSectionOption> courseSections) {}

    @GetMapping
    public Options options(@AuthenticationPrincipal Jwt jwt) {
        Actor actor = actors.from(jwt);
        if (actor.isAdmin()) {
            return new Options(false, findCourseSections(null));
        }
        if (actor.teacherId() == null) {
            return new Options(true, List.of());
        }
        return new Options(true, findCourseSections(actor.teacherId()));
    }

    private List<CourseSectionOption> findCourseSections(Long teacherId) {
        return jdbc.query("""
                SELECT cs.id,
                       cs.section_code,
                       cs.section_name,
                       s.id AS subject_id,
                       s.subject_code,
                       s.name AS subject_name,
                       sem.id AS semester_id,
                       sem.name AS semester_name,
                       cs.status
                FROM course_sections cs
                JOIN subjects s ON s.id = cs.subject_id
                JOIN semesters sem ON sem.id = cs.semester_id
                WHERE cs.status <> 'CANCELLED'
                  AND (CAST(? AS BIGINT) IS NULL OR EXISTS (
                      SELECT 1
                      FROM teaching_assignments ta
                      WHERE ta.course_section_id = cs.id
                        AND ta.teacher_id = ?
                  ))
                ORDER BY sem.academic_year DESC, sem.term_number DESC, s.name, cs.section_code
                """,
                (rs, row) -> new CourseSectionOption(
                        rs.getLong("id"),
                        rs.getString("section_code"),
                        rs.getString("section_name"),
                        rs.getLong("subject_id"),
                        rs.getString("subject_code"),
                        rs.getString("subject_name"),
                        rs.getLong("semester_id"),
                        rs.getString("semester_name"),
                        rs.getString("status")),
                teacherId, teacherId);
    }
}
