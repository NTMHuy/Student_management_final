package com.example.student_management_api.teacher;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/teaching-assignments")
public class TeachingAssignmentController {
    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public TeachingAssignmentController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record Assignment(Long id, Long teacherId, String teacherName,
            Long classId, String className, Long subjectId, String subjectCode, String subjectName) {}
    public record AssignmentRequest(Long teacherId, Long classId, Long subjectId) {}

    @GetMapping
    public List<Assignment> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long teacherId) {
        Actor actor = actors.from(jwt);
        if (!actor.isAdmin()) {
            if (actor.teacherId() == null || (teacherId != null && !teacherId.equals(actor.teacherId()))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem phân công này");
            }
            teacherId = actor.teacherId();
        }
        return jdbc.query("""
            SELECT tcs.id, t.id AS teacher_id, t.full_name AS teacher_name,
                   c.id AS class_id, c.class_name, s.id AS subject_id, s.subject_code, s.name AS subject_name
            FROM teacher_class_subjects tcs
            JOIN teachers t ON t.id=tcs.teacher_id
            JOIN classes c ON c.id=tcs.class_id
            JOIN subjects s ON s.id=tcs.subject_id
            WHERE (? IS NULL OR t.id=?)
            ORDER BY t.full_name,c.class_name,s.name
            """, (rs,n) -> new Assignment(rs.getLong("id"),rs.getLong("teacher_id"),
                rs.getString("teacher_name"),rs.getLong("class_id"),rs.getString("class_name"),
                rs.getLong("subject_id"),rs.getString("subject_code"),rs.getString("subject_name")),
            teacherId, teacherId);
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Assignment create(@AuthenticationPrincipal Jwt jwt, @RequestBody AssignmentRequest body) {
        actors.from(jwt).requireAdmin();
        if (body.teacherId() == null || body.classId() == null || body.subjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn giáo viên, lớp và môn học");
        }
        try {
            jdbc.update("INSERT INTO teacher_class_subjects(teacher_id,class_id,subject_id) VALUES (?,?,?)",
                body.teacherId(), body.classId(), body.subjectId());
        } catch (org.springframework.dao.DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phân công này đã tồn tại");
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giáo viên, lớp hoặc môn học không tồn tại");
        }
        return jdbc.queryForObject("""
            SELECT tcs.id,t.id AS teacher_id,t.full_name AS teacher_name,c.id AS class_id,c.class_name,
                   s.id AS subject_id,s.subject_code,s.name AS subject_name
            FROM teacher_class_subjects tcs JOIN teachers t ON t.id=tcs.teacher_id
            JOIN classes c ON c.id=tcs.class_id JOIN subjects s ON s.id=tcs.subject_id
            WHERE tcs.teacher_id=? AND tcs.class_id=? AND tcs.subject_id=?
            """, (rs,n) -> new Assignment(rs.getLong("id"),rs.getLong("teacher_id"),rs.getString("teacher_name"),
                rs.getLong("class_id"),rs.getString("class_name"),rs.getLong("subject_id"),
                rs.getString("subject_code"),rs.getString("subject_name")),
            body.teacherId(),body.classId(),body.subjectId());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        actors.from(jwt).requireAdmin();
        int deleted = jdbc.update("DELETE FROM teacher_class_subjects WHERE id=?", id);
        if (deleted == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phân công");
    }
}
