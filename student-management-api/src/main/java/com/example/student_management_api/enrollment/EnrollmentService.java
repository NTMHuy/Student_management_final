package com.example.student_management_api.enrollment;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.coursesection.CourseSection;
import com.example.student_management_api.coursesection.CourseSectionRepository;
import com.example.student_management_api.student.Student;
import com.example.student_management_api.student.StudentRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EnrollmentService {
    private static final List<Enrollment.Status> CAPACITY_STATUSES =
        List.of(Enrollment.Status.REGISTERED, Enrollment.Status.ACTIVE);

    private final EnrollmentRepository enrollments;
    private final StudentRepository students;
    private final CourseSectionRepository sections;

    public EnrollmentService(EnrollmentRepository enrollments, StudentRepository students,
                             CourseSectionRepository sections) {
        this.enrollments = enrollments;
        this.students = students;
        this.sections = sections;
    }

    public List<EnrollmentResponse> list(Long courseSectionId, Long studentId, String status) {
        Enrollment.Status parsed = Text.parseEnum(
            Enrollment.Status.class, status, "Trạng thái đăng ký học phần không hợp lệ");
        return enrollments.findAll().stream()
            .filter(e -> courseSectionId == null || e.getCourseSection().getId().equals(courseSectionId))
            .filter(e -> studentId == null || e.getStudent().getId().equals(studentId))
            .filter(e -> parsed == null || e.getStatus() == parsed)
            .map(EnrollmentResponse::from)
            .toList();
    }

    public EnrollmentResponse get(Long id) {
        return EnrollmentResponse.from(find(id));
    }

    @Transactional
    public EnrollmentResponse create(Actor actor, EnrollmentRequest request) {
        actor.requireAdmin();
        Student student = students.findById(request.studentId())
            .orElseThrow(() -> Text.badRequest("Sinh viên không tồn tại"));
        if (student.getStatus() != Student.Status.ACTIVE) {
            throw Text.conflict("Chỉ được đăng ký học phần cho sinh viên đang học");
        }

        CourseSection section = sections.findById(request.courseSectionId())
            .orElseThrow(() -> Text.badRequest("Lớp học phần không tồn tại"));
        if (section.getStatus() != CourseSection.Status.OPEN) {
            throw Text.conflict("Lớp học phần chưa mở đăng ký hoặc đã đóng");
        }
        if (enrollments.existsByStudentIdAndCourseSectionId(student.getId(), section.getId())) {
            throw Text.conflict("Sinh viên đã được đăng ký vào lớp học phần này");
        }

        long occupied = enrollments.countByCourseSectionIdAndStatusIn(section.getId(), CAPACITY_STATUSES);
        if (occupied >= section.getCapacity()) {
            throw Text.conflict("Lớp học phần đã đủ sĩ số");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourseSection(section);
        enrollment.setStatus(Enrollment.Status.REGISTERED);
        return EnrollmentResponse.from(enrollments.saveAndFlush(enrollment));
    }

    @Transactional
    public EnrollmentResponse updateStatus(Actor actor, Long id, String status) {
        actor.requireAdmin();
        Enrollment enrollment = find(id);
        Enrollment.Status next = Text.parseEnum(
            Enrollment.Status.class, status, "Trạng thái đăng ký học phần không hợp lệ");
        if (next == null) {
            throw Text.badRequest("Vui lòng cung cấp trạng thái mới");
        }
        if (enrollment.getStatus() == Enrollment.Status.WITHDRAWN
                && next != Enrollment.Status.WITHDRAWN) {
            throw Text.conflict("Không thể khôi phục đăng ký đã rút; hãy tạo đăng ký mới theo quy trình");
        }
        if (next == Enrollment.Status.WITHDRAWN) {
            enrollment.setWithdrawnAt(Instant.now());
        } else if (enrollment.getStatus() == Enrollment.Status.WITHDRAWN) {
            throw Text.conflict("Đăng ký đã được rút");
        }
        enrollment.setStatus(next);
        return EnrollmentResponse.from(enrollment);
    }

    @Transactional
    public void delete(Actor actor, Long id) {
        actor.requireAdmin();
        enrollments.delete(find(id));
        enrollments.flush();
    }

    private Enrollment find(Long id) {
        return enrollments.findById(id)
            .orElseThrow(() -> Text.notFound("Không tìm thấy đăng ký học phần"));
    }
}
