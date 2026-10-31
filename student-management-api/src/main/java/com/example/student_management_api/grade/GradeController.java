package com.example.student_management_api.grade;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.auth.ActorResolver;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/grades")
public class GradeController {

    private static final List<String> TYPES = List.of("PROCESS", "MIDTERM", "FINAL");
    private static final Pattern SCHOOL_YEAR = Pattern.compile("^\\d{4}-\\d{4}$");

    private final JdbcTemplate jdbc;
    private final ActorResolver actors;

    public GradeController(JdbcTemplate jdbc, ActorResolver actors) {
        this.jdbc = jdbc;
        this.actors = actors;
    }

    public record GradeRow(Long id, Long studentId, String studentCode, String fullName,
            Long subjectId, String schoolYear, Integer semester, String assessmentType,
            Integer assessmentNumber, BigDecimal score, String note) {}

    public record GradeResult(Long studentId, BigDecimal processAverage, BigDecimal midtermScore,
            BigDecimal finalScore, BigDecimal processWeight, BigDecimal midtermWeight,
            BigDecimal finalWeight, BigDecimal totalScore, java.time.OffsetDateTime calculatedAt) {}

    public record GradeUpdate(Long studentId, Long classId, Long subjectId, String schoolYear,
            Integer semester, String assessmentType, Integer assessmentNumber, BigDecimal score, String note) {}

    public record BatchEntry(Long studentId, String assessmentType, Integer assessmentNumber,
            BigDecimal score, String note) {}

    public record BatchRequest(Long classId, Long subjectId, String schoolYear, Integer semester,
            List<BatchEntry> entries) {}

    @GetMapping
    public List<GradeRow> list(@AuthenticationPrincipal Jwt jwt, @RequestParam Long classId,
            @RequestParam Long subjectId, @RequestParam String schoolYear, @RequestParam Integer semester) {
        requireClassSubjectAccess(actors.from(jwt), classId, subjectId);
        validateTerm(schoolYear, semester);
        return jdbc.query("""
            SELECT gr.id, s.id AS student_id, s.student_code, s.full_name, gr.subject_id,
                   gr.school_year, gr.semester, gr.assessment_type, gr.assessment_number, gr.score, gr.note
            FROM students s LEFT JOIN grade_records gr
              ON gr.student_id=s.id AND gr.class_id=s.class_id AND gr.subject_id=?
             AND gr.school_year=? AND gr.semester=?
            WHERE s.class_id=? AND s.status='ACTIVE'
            ORDER BY s.student_code, gr.assessment_type, gr.assessment_number
            """, (rs,n) -> new GradeRow(nullableLong(rs, "id"), rs.getLong("student_id"),
                rs.getString("student_code"), rs.getString("full_name"),
                nullableLong(rs, "subject_id"), rs.getString("school_year"),
                nullableInt(rs, "semester"), rs.getString("assessment_type"),
                nullableInt(rs, "assessment_number"), rs.getBigDecimal("score"), rs.getString("note")),
            subjectId, schoolYear, semester, classId);
    }

    @GetMapping("/results")
    public List<GradeResult> results(@AuthenticationPrincipal Jwt jwt, @RequestParam Long classId,
            @RequestParam Long subjectId, @RequestParam String schoolYear, @RequestParam Integer semester) {
        requireClassSubjectAccess(actors.from(jwt), classId, subjectId);
        validateTerm(schoolYear, semester);
        return jdbc.query("""
            SELECT student_id, process_average, midterm_score, final_score,
                   process_weight, midterm_weight, final_weight, total_score, calculated_at
            FROM grade_results
            WHERE class_id=? AND subject_id=? AND school_year=? AND semester=?
            ORDER BY student_id
            """, (rs,n) -> new GradeResult(rs.getLong("student_id"), rs.getBigDecimal("process_average"),
                rs.getBigDecimal("midterm_score"), rs.getBigDecimal("final_score"),
                rs.getBigDecimal("process_weight"), rs.getBigDecimal("midterm_weight"),
                rs.getBigDecimal("final_weight"), rs.getBigDecimal("total_score"),
                rs.getObject("calculated_at", java.time.OffsetDateTime.class)),
            classId, subjectId, schoolYear, semester);
    }

    @PutMapping
    @Transactional
    public GradeRow upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody GradeUpdate body) {
        Actor actor = actors.from(jwt);
        validateRequest(body.classId(), body.subjectId(), body.studentId());
        requireClassSubjectAccess(actor, body.classId(), body.subjectId());
        validateTerm(body.schoolYear(), body.semester());
        validateCell(body.assessmentType(), body.assessmentNumber());
        BigDecimal score = normalizeScore(body.score());
        if (score == null) throw badRequest("Vui lòng nhập điểm từ 0 đến 10");
        requireStudentInClass(body.studentId(), body.classId());
        Long teacherId = resolveTeacherId(actor, body.classId(), body.subjectId());
        save(body.studentId(), body.classId(), body.subjectId(), teacherId, body.schoolYear(),
                body.semester(), body.assessmentType(), body.assessmentNumber(), score, body.note());
        refreshResult(body.studentId(), body.classId(), body.subjectId(), body.schoolYear(), body.semester());
        return findRow(body.studentId(), body.subjectId(), body.schoolYear(), body.semester(),
                body.assessmentType(), body.assessmentNumber());
    }

    @PutMapping("/batch")
    @Transactional
    public void saveBatch(@AuthenticationPrincipal Jwt jwt, @RequestBody BatchRequest body) {
        Actor actor = actors.from(jwt);
        validateRequest(body.classId(), body.subjectId(), 1L);
        if (body.entries() == null) throw badRequest("Thiếu danh sách điểm");
        requireClassSubjectAccess(actor, body.classId(), body.subjectId());
        validateTerm(body.schoolYear(), body.semester());
        Long teacherId = null;
        java.util.Set<Long> changedStudents = new java.util.HashSet<>();
        for (BatchEntry entry : body.entries()) {
            if (entry.studentId() == null) throw badRequest("Thiếu sinh viên trong bảng điểm");
            validateCell(entry.assessmentType(), entry.assessmentNumber());
            requireStudentInClass(entry.studentId(), body.classId());
            if (entry.score() == null) {
                jdbc.update("""
                    DELETE FROM grade_records
                    WHERE student_id=? AND class_id=? AND subject_id=? AND school_year=? AND semester=?
                      AND assessment_type=? AND assessment_number=?
                    """, entry.studentId(), body.classId(), body.subjectId(), body.schoolYear(),
                    body.semester(), entry.assessmentType(), entry.assessmentNumber());
            } else {
                BigDecimal score = normalizeScore(entry.score());
                if (score == null) throw badRequest("Điểm phải nằm trong khoảng từ 0 đến 10");
                if (teacherId == null) teacherId = resolveTeacherId(actor, body.classId(), body.subjectId());
                save(entry.studentId(), body.classId(), body.subjectId(), teacherId, body.schoolYear(),
                        body.semester(), entry.assessmentType(), entry.assessmentNumber(), score, entry.note());
            }
            changedStudents.add(entry.studentId());
        }
        for (Long studentId : changedStudents) {
            refreshResult(studentId, body.classId(), body.subjectId(), body.schoolYear(), body.semester());
        }
    }

    @DeleteMapping
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @RequestParam Long studentId,
            @RequestParam Long classId, @RequestParam Long subjectId, @RequestParam String schoolYear,
            @RequestParam Integer semester, @RequestParam String assessmentType,
            @RequestParam(defaultValue = "1") Integer assessmentNumber) {
        requireClassSubjectAccess(actors.from(jwt), classId, subjectId);
        validateTerm(schoolYear, semester);
        validateCell(assessmentType, assessmentNumber);
        requireStudentInClass(studentId, classId);
        jdbc.update("""
            DELETE FROM grade_records WHERE student_id=? AND class_id=? AND subject_id=?
              AND school_year=? AND semester=? AND assessment_type=? AND assessment_number=?
            """, studentId, classId, subjectId, schoolYear, semester, assessmentType, assessmentNumber);
        refreshResult(studentId, classId, subjectId, schoolYear, semester);
    }

    private void refreshResult(Long studentId, Long classId, Long subjectId, String year, Integer semester) {
        List<BigDecimal> processScores = jdbc.query("""
            SELECT score FROM grade_records WHERE student_id=? AND subject_id=? AND school_year=?
              AND semester=? AND assessment_type='PROCESS' ORDER BY assessment_number
            """, (rs,n) -> rs.getBigDecimal(1), studentId, subjectId, year, semester);
        BigDecimal midterm = oneScore(studentId, subjectId, year, semester, "MIDTERM");
        BigDecimal finalScore = oneScore(studentId, subjectId, year, semester, "FINAL");

        if (processScores.isEmpty() || midterm == null || finalScore == null) {
            jdbc.update("""
                DELETE FROM grade_results WHERE student_id=? AND subject_id=? AND school_year=? AND semester=?
                """, studentId, subjectId, year, semester);
            return;
        }

        BigDecimal processAverage = processScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(processScores.size()), 4, RoundingMode.HALF_UP);
        List<GradeResult> existing = jdbc.query("""
            SELECT student_id, process_average, midterm_score, final_score,
                   process_weight, midterm_weight, final_weight, total_score, calculated_at
            FROM grade_results WHERE student_id=? AND subject_id=? AND school_year=? AND semester=?
            """, (rs,n) -> new GradeResult(rs.getLong("student_id"), rs.getBigDecimal("process_average"),
                rs.getBigDecimal("midterm_score"), rs.getBigDecimal("final_score"),
                rs.getBigDecimal("process_weight"), rs.getBigDecimal("midterm_weight"),
                rs.getBigDecimal("final_weight"), rs.getBigDecimal("total_score"),
                rs.getObject("calculated_at", java.time.OffsetDateTime.class)),
            studentId, subjectId, year, semester);

        BigDecimal pw, mw, fw;
        if (!existing.isEmpty()) {
            GradeResult snapshot = existing.get(0);
            pw = snapshot.processWeight(); mw = snapshot.midtermWeight(); fw = snapshot.finalWeight();
        } else {
            List<BigDecimal> weights = jdbc.query("""
                SELECT process_weight, midterm_weight, final_weight FROM subjects WHERE id=?
                """, (rs,n) -> List.of(rs.getBigDecimal(1), rs.getBigDecimal(2), rs.getBigDecimal(3)), subjectId);
            if (weights.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy môn học");
            pw = weights.get(0); mw = weights.get(1); fw = weights.get(2);
        }
        BigDecimal total = processAverage.multiply(pw).add(midterm.multiply(mw))
                .add(finalScore.multiply(fw)).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        jdbc.update("""
            INSERT INTO grade_results(student_id,class_id,subject_id,school_year,semester,
                process_average,midterm_score,final_score,process_weight,midterm_weight,final_weight,total_score)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (student_id,subject_id,school_year,semester) DO UPDATE SET
                class_id=EXCLUDED.class_id, process_average=EXCLUDED.process_average,
                midterm_score=EXCLUDED.midterm_score, final_score=EXCLUDED.final_score,
                total_score=EXCLUDED.total_score, updated_at=now()
            """, studentId, classId, subjectId, year, semester, processAverage, midterm, finalScore,
            pw, mw, fw, total);
    }

    private BigDecimal oneScore(Long studentId, Long subjectId, String year, Integer semester, String type) {
        List<BigDecimal> scores = jdbc.query("""
            SELECT score FROM grade_records WHERE student_id=? AND subject_id=? AND school_year=?
              AND semester=? AND assessment_type=? AND assessment_number=1
            """, (rs,n) -> rs.getBigDecimal(1), studentId, subjectId, year, semester, type);
        return scores.isEmpty() ? null : scores.get(0);
    }

    private GradeRow findRow(Long studentId, Long subjectId, String year, Integer semester, String type, Integer number) {
        return jdbc.queryForObject("""
            SELECT gr.id,s.id AS student_id,s.student_code,s.full_name,gr.subject_id,gr.school_year,gr.semester,
                   gr.assessment_type,gr.assessment_number,gr.score,gr.note
            FROM grade_records gr JOIN students s ON s.id=gr.student_id
            WHERE gr.student_id=? AND gr.subject_id=? AND gr.school_year=? AND gr.semester=?
              AND gr.assessment_type=? AND gr.assessment_number=?
            """, (rs,n) -> new GradeRow(rs.getLong("id"),rs.getLong("student_id"),rs.getString("student_code"),
                rs.getString("full_name"),rs.getLong("subject_id"),rs.getString("school_year"),
                rs.getInt("semester"),rs.getString("assessment_type"),rs.getInt("assessment_number"),
                rs.getBigDecimal("score"),rs.getString("note")), studentId,subjectId,year,semester,type,number);
    }

    private void save(Long studentId, Long classId, Long subjectId, Long teacherId, String year,
            Integer semester, String type, Integer number, BigDecimal score, String note) {
        jdbc.update("""
            INSERT INTO grade_records(student_id,class_id,subject_id,teacher_id,school_year,semester,
                assessment_type,assessment_number,score,note)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (student_id,subject_id,school_year,semester,assessment_type,assessment_number)
            DO UPDATE SET class_id=EXCLUDED.class_id, teacher_id=EXCLUDED.teacher_id,
                score=EXCLUDED.score, note=COALESCE(EXCLUDED.note, grade_records.note), updated_at=now()
            """, studentId,classId,subjectId,teacherId,year,semester,type,number,score,
            note == null || note.isBlank() ? null : note.trim());
    }

    private void validateRequest(Long classId, Long subjectId, Long studentId) {
        if (classId == null || subjectId == null || studentId == null) throw badRequest("Thông tin điểm số không hợp lệ");
    }
    private static Long nullableLong(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        long value=rs.getLong(column); return rs.wasNull()?null:value;
    }
    private static Integer nullableInt(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
        int value=rs.getInt(column); return rs.wasNull()?null:value;
    }
    private void validateTerm(String year, Integer semester) {
        if (year==null || !SCHOOL_YEAR.matcher(year).matches()) throw badRequest("Năm học không hợp lệ (ví dụ 2025-2026)");
        if (semester==null || (semester!=1 && semester!=2)) throw badRequest("Học kỳ phải là 1 hoặc 2");
    }
    private void validateCell(String type, Integer number) {
        if (type==null || !TYPES.contains(type)) throw badRequest("Loại điểm không hợp lệ");
        if (number==null || number<1) throw badRequest("Lần đánh giá không hợp lệ");
        if (!"PROCESS".equals(type) && number != 1) throw badRequest("Điểm giữa kỳ và cuối kỳ chỉ có một lần nhập");
    }
    private BigDecimal normalizeScore(BigDecimal score) {
        if (score==null || score.compareTo(BigDecimal.ZERO)<0 || score.compareTo(BigDecimal.TEN)>0
                || score.stripTrailingZeros().scale()>2) return null;
        return score.setScale(2, RoundingMode.HALF_UP);
    }
    private void requireStudentInClass(Long studentId, Long classId) {
        Integer count=jdbc.queryForObject("SELECT count(*) FROM students WHERE id=? AND class_id=?",Integer.class,studentId,classId);
        if (count==null || count==0) throw badRequest("Sinh viên không thuộc lớp");
    }
    private Long resolveTeacherId(Actor actor, Long classId, Long subjectId) {
        if (!actor.isAdmin()) return actor.teacherId();
        Long id=jdbc.queryForObject("""
            SELECT COALESCE((SELECT teacher_id FROM teacher_class_subjects WHERE class_id=? AND subject_id=? ORDER BY id LIMIT 1),
                (SELECT head_teacher_id FROM subjects WHERE id=?),(SELECT homeroom_teacher_id FROM classes WHERE id=?))
            """,Long.class,classId,subjectId,subjectId,classId);
        if(id==null) throw badRequest("Hãy phân công giảng viên cho lớp và môn học trước khi nhập điểm");
        return id;
    }
    private void requireClassSubjectAccess(Actor actor, Long classId, Long subjectId) {
        if(actor.isAdmin()) return;
        if(actor.teacherId()==null) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Tài khoản chưa gắn hồ sơ giảng viên");
        Integer allowed=jdbc.queryForObject("SELECT count(*) FROM teacher_class_subjects WHERE teacher_id=? AND class_id=? AND subject_id=?",
                Integer.class,actor.teacherId(),classId,subjectId);
        if(allowed==null || allowed==0) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Bạn không được phân công môn học này ở lớp đã chọn");
    }
    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);
    }
}
