package com.example.student_management_api.student;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Gender;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.studentclass.StudentClass;
import com.example.student_management_api.studentclass.StudentClassRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Quản lý hồ sơ sinh viên đại học.
 * Trong giai đoạn chuyển đổi, chỉ ADMIN được CRUD hồ sơ sinh viên.
 * Phạm vi dữ liệu dành cho giáo viên sẽ được bổ sung cùng module phân công giảng dạy.
 */
@Service
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository students;
    private final StudentClassRepository studentClasses;

    public StudentService(StudentRepository students, StudentClassRepository studentClasses) {
        this.students = students;
        this.studentClasses = studentClasses;
    }

    public List<StudentResponse> list(
            Actor actor, String search, Long studentClassId, Long majorId, String status) {
        actor.requireAdmin();

        String q = Text.normalizeQuery(search);
        Student.Status st = Text.parseEnum(Student.Status.class, status, "Trạng thái không hợp lệ");

        return students.findAllByOrderByStudentCode().stream()
                .filter(s -> q.isEmpty()
                        || Text.containsIgnoreCase(s.getStudentCode(), q)
                        || Text.containsIgnoreCase(s.getFullName(), q)
                        || Text.containsIgnoreCase(s.getEmail(), q)
                        || Text.containsIgnoreCase(s.getPhone(), q))
                .filter(s -> studentClassId == null
                        || s.getStudentClass().getId().equals(studentClassId))
                .filter(s -> majorId == null
                        || s.getStudentClass().getMajor().getId().equals(majorId))
                .filter(s -> st == null || s.getStatus() == st)
                .map(StudentResponse::from)
                .toList();
    }

    public StudentResponse get(Actor actor, Long id) {
        actor.requireAdmin();
        Student student = students.findWithStudentClassById(id)
                .orElseThrow(() -> Text.notFound("Không tìm thấy sinh viên"));
        return StudentResponse.from(student);
    }

    @Transactional
    public StudentResponse create(Actor actor, StudentRequest request) {
        actor.requireAdmin();
        StudentClass target = resolveStudentClass(request.studentClassId());

        Student student = new Student();
        apply(student, request, target);
        // Mã tạm đáp ứng NOT NULL/UNIQUE trước khi lấy ID sinh tự động.
        student.setStudentCode("TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        students.saveAndFlush(student);
        student.setStudentCode(String.format("SV%06d", student.getId()));
        return StudentResponse.from(student);
    }

    @Transactional
    public StudentResponse update(Actor actor, Long id, StudentRequest request) {
        actor.requireAdmin();
        Student student = students.findWithStudentClassById(id)
                .orElseThrow(() -> Text.notFound("Không tìm thấy sinh viên"));
        StudentClass target = resolveStudentClass(request.studentClassId());
        apply(student, request, target);
        return StudentResponse.from(student);
    }

    @Transactional
    public void delete(Actor actor, Long id) {
        actor.requireAdmin();
        Student student = students.findWithStudentClassById(id)
                .orElseThrow(() -> Text.notFound("Không tìm thấy sinh viên"));
        students.delete(student);
    }

    private StudentClass resolveStudentClass(Long id) {
        StudentClass target = studentClasses.findById(id)
                .orElseThrow(() -> Text.badRequest("Lớp sinh viên không tồn tại"));
        if (target.getStatus() != StudentClass.Status.ACTIVE) {
            throw Text.conflict("Không thể thêm sinh viên vào lớp đã lưu trữ");
        }
        return target;
    }

    private void apply(Student student, StudentRequest request, StudentClass target) {
        Gender gender = Text.parseEnum(Gender.class, request.gender(), "Giới tính không hợp lệ");
        if (gender == null) {
            throw Text.badRequest("Giới tính không hợp lệ");
        }

        String email = Text.blankToNull(request.email());
        if (email != null && students.existsByEmailIgnoreCase(email)
                && !email.equalsIgnoreCase(student.getEmail() == null ? "" : student.getEmail())) {
            throw Text.conflict("Email sinh viên đã được sử dụng");
        }

        Student.Status status = Text.parseEnum(
                Student.Status.class, request.status(), "Trạng thái không hợp lệ");

        student.setFullName(request.fullName().trim());
        student.setDateOfBirth(request.dateOfBirth());
        student.setGender(gender);
        student.setStudentClass(target);
        student.setEmail(email);
        student.setPhone(Text.blankToNull(request.phone()));
        student.setNotes(Text.blankToNull(request.notes()));
        if (status != null) {
            student.setStatus(status);
        }
    }
}