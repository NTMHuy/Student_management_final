package com.example.student_management_api.student;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Gender;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.schoolclass.SchoolClass;
import com.example.student_management_api.schoolclass.SchoolClassRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Phân quyền: ADMIN thao tác mọi học sinh; giáo viên chỉ thấy và thao tác học sinh
 * thuộc lớp mình chủ nhiệm.
 */
@Service
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository students;
    private final SchoolClassRepository classes;

    public StudentService(StudentRepository students, SchoolClassRepository classes) {
        this.students = students;
        this.classes = classes;
    }

    public List<StudentResponse> list(
            Actor actor, String search, String gradeLevel, String className, String status) {
        String q = Text.normalizeQuery(search);
        String grade = Text.normalizeQuery(gradeLevel);
        String cls = Text.normalizeQuery(className);
        Student.Status st = Text.parseEnum(Student.Status.class, status, "Trạng thái không hợp lệ");

        List<Student> source;
        if (actor.isAdmin()) {
            source = students.findAllWithClass();
        } else if (actor.teacherId() == null) {
            source = List.of();
        } else {
            source = students.findAllByHomeroomTeacher(actor.teacherId());
        }

        return source.stream()
                .filter(s -> q.isEmpty()
                        || Text.containsIgnoreCase(s.getStudentCode(), q)
                        || Text.containsIgnoreCase(s.getFullName(), q)
                        || Text.containsIgnoreCase(s.getParentEmail(), q)
                        || Text.containsIgnoreCase(s.getPhone(), q))
                .filter(s -> grade.isEmpty() || String.valueOf(s.getSchoolClass().getGradeLevel()).equals(grade))
                .filter(s -> cls.isEmpty() || s.getSchoolClass().getClassName().equalsIgnoreCase(cls))
                .filter(s -> st == null || s.getStatus() == st)
                .map(StudentResponse::from)
                .toList();
    }

    public StudentResponse get(Actor actor, Long id) {
        Student student = findVisible(actor, id);
        return StudentResponse.from(student);
    }

    @Transactional
    public StudentResponse create(Actor actor, StudentRequest request) {
        SchoolClass target = resolveClass(request);
        ensureCanManage(actor, target);
        ensureCapacity(target);

        Student student = new Student();
        apply(student, request, target);
        // Mã tạm để thỏa NOT NULL / UNIQUE, rồi đặt mã thật theo id vừa sinh
        student.setStudentCode("TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        students.saveAndFlush(student);
        student.setStudentCode(String.format("HS%05d", student.getId()));
        return StudentResponse.from(student);
    }

    @Transactional
    public StudentResponse update(Actor actor, Long id, StudentRequest request) {
        Student student = findVisible(actor, id);
        ensureCanManage(actor, student.getSchoolClass());

        SchoolClass target = resolveClass(request);
        if (!target.getId().equals(student.getSchoolClass().getId())) {
            ensureCanManage(actor, target);
            ensureCapacity(target);
        }

        apply(student, request, target);
        return StudentResponse.from(student);
    }

    @Transactional
    public void delete(Actor actor, Long id) {
        Student student = findVisible(actor, id);
        ensureCanManage(actor, student.getSchoolClass());
        students.delete(student); // class_leaders.student_id: ON DELETE CASCADE
    }

    // ---------- nội bộ ----------

    /** Học sinh ngoài phạm vi của giáo viên được coi như không tồn tại (404). */
    private Student findVisible(Actor actor, Long id) {
        Student student = students.findWithClassById(id)
                .orElseThrow(() -> Text.notFound("Không tìm thấy học sinh"));
        if (!canManage(actor, student.getSchoolClass())) {
            throw Text.notFound("Không tìm thấy học sinh");
        }
        return student;
    }

    private boolean canManage(Actor actor, SchoolClass schoolClass) {
        if (actor.isAdmin()) {
            return true;
        }
        return schoolClass.getHomeroomTeacher() != null
                && actor.isTeacherWithId(schoolClass.getHomeroomTeacher().getId());
    }

    private void ensureCanManage(Actor actor, SchoolClass schoolClass) {
        if (!canManage(actor, schoolClass)) {
            throw Text.forbidden("Bạn chỉ được thao tác với học sinh thuộc lớp mình chủ nhiệm");
        }
    }

    private void ensureCapacity(SchoolClass schoolClass) {
        long current = students.countBySchoolClassId(schoolClass.getId());
        if (current >= schoolClass.getMaxStudents()) {
            throw Text.conflict("Lớp " + schoolClass.getClassName() + " đã đủ sĩ số tối đa ("
                    + schoolClass.getMaxStudents() + ")");
        }
    }

    private SchoolClass resolveClass(StudentRequest request) {
        SchoolClass schoolClass = classes.findByClassNameIgnoreCase(request.className().trim())
                .orElseThrow(() -> Text.badRequest("Lớp không tồn tại"));
        if (request.gradeLevel() != null && !request.gradeLevel().equals(schoolClass.getGradeLevel())) {
            throw Text.badRequest("Lớp " + schoolClass.getClassName() + " không thuộc khối " + request.gradeLevel());
        }
        return schoolClass;
    }

    private void apply(Student student, StudentRequest r, SchoolClass target) {
        Gender gender = Text.parseEnum(Gender.class, r.gender(), "Giới tính không hợp lệ");
        if (gender == null) {
            throw Text.badRequest("Giới tính không hợp lệ");
        }

        String parentEmail = Text.blankToNull(r.parentEmail());
        Optional<Student.Status> status = Optional.ofNullable(
                Text.parseEnum(Student.Status.class, r.status(), "Trạng thái không hợp lệ"));

        student.setFullName(r.fullName().trim());
        student.setDateOfBirth(r.dateOfBirth());
        student.setGender(gender);
        student.setSchoolClass(target);
        student.setParentEmail(parentEmail);
        student.setPhone(Text.blankToNull(r.phone()));
        student.setNotes(Text.blankToNull(r.notes()));
        status.ifPresent(student::setStatus);
    }
}
