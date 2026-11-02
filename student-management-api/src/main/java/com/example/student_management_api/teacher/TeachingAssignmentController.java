package com.example.student_management_api.teacher;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * University teaching assignments are scoped to a course section, not a school class/subject pair.
 */
@RestController
@RequestMapping("/api/teaching-assignments")
public class TeachingAssignmentController {
    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public TeachingAssignmentController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record Assignment(
            Long id,
            Long teacherId,
            String teacherName,
            Long courseSectionId,
            String sectionCode,
            String sectionName,
            Long subjectId,
            String subjectCode,
            String subjectName,
            Long semesterId,
            String semesterName) {}

    public record AssignmentRequest(Long teacherId, Long courseSectionId) {}

    @GetMapping
    public List<Assignment> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) Long courseSectionId) {
        Actor actor = actors.from(jwt);
        if (!actor.isAdmin()) {
            if (actor.teacherId() == null
                    || (teacherId != null && !teacherId.equals(actor.teacherId()))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Bạn không có quyền xem phân công này");
            }
            teacherId = actor.teacherId();
        }

        return jdbc.query("""
                SELECT ta.id,
                       t.id AS teacher_id, t.full_name AS teacher_name,
                       cs.id AS course_section_id, cs.section_code, cs.section_name,
                       s.id AS subject_id, s.subject_code, s.name AS subject_name,
                       sem.id AS semester_id, sem.name AS semester_name
                FROM teaching_assignments ta
                JOIN teachers t ON t.id = ta.teacher_id
                JOIN course_sections cs ON cs.id = ta.course_section_id
                JOIN subjects s ON s.id = cs.subject_id
                JOIN semesters sem ON sem.id = cs.semester_id
                WHERE (CAST(? AS BIGINT) IS NULL OR ta.teacher_id = ?)
                  AND (CAST(? AS BIGINT) IS NULL OR ta.course_section_id = ?)
                ORDER BY t.full_name, sem.academic_year, sem.term_number, cs.section_code
                """,
                (rs, row) -> new Assignment(
                        rs.getLong("id"),
                        rs.getLong("teacher_id"),
                        rs.getString("teacher_name"),
                        rs.getLong("course_section_id"),
                        rs.getString("section_code"),
                        rs.getString("section_name"),
                        rs.getLong("subject_id"),
                        rs.getString("subject_code"),
                        rs.getString("subject_name"),
                        rs.getLong("semester_id"),
                        rs.getString("semester_name")),
                teacherId, teacherId, courseSectionId, courseSectionId);
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Assignment create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody AssignmentRequest request) {
        actors.from(jwt).requireAdmin();
        if (request == null || request.teacherId() == null || request.courseSectionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cần chọn giáo viên và lớp học phần");
        }

        try {
            jdbc.update("""
                    INSERT INTO teaching_assignments (teacher_id, course_section_id)
                    VALUES (?, ?)
                    """, request.teacherId(), request.courseSectionId());
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Giáo viên đã được phân công vào lớp học phần này");
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giáo viên hoặc lớp học phần không tồn tại");
        }

        return findAssignment(request.teacherId(), request.courseSectionId());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        actors.from(jwt).requireAdmin();
        int deleted = jdbc.update("DELETE FROM teaching_assignments WHERE id = ?", id);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Không tìm thấy phân công giảng dạy");
        }
    }

    private Assignment findAssignment(Long teacherId, Long courseSectionId) {
        return jdbc.queryForObject("""
                SELECT ta.id,
                       t.id AS teacher_id, t.full_name AS teacher_name,
                       cs.id AS course_section_id, cs.section_code, cs.section_name,
                       s.id AS subject_id, s.subject_code, s.name AS subject_name,
                       sem.id AS semester_id, sem.name AS semester_name
                FROM teaching_assignments ta
                JOIN teachers t ON t.id = ta.teacher_id
                JOIN course_sections cs ON cs.id = ta.course_section_id
                JOIN subjects s ON s.id = cs.subject_id
                JOIN semesters sem ON sem.id = cs.semester_id
                WHERE ta.teacher_id = ? AND ta.course_section_id = ?
                """,
                (rs, row) -> new Assignment(
                        rs.getLong("id"),
                        rs.getLong("teacher_id"),
                        rs.getString("teacher_name"),
                        rs.getLong("course_section_id"),
                        rs.getString("section_code"),
                        rs.getString("section_name"),
                        rs.getLong("subject_id"),
                        rs.getString("subject_code"),
                        rs.getString("subject_name"),
                        rs.getLong("semester_id"),
                        rs.getString("semester_name")),
                teacherId, courseSectionId);
    }
}
