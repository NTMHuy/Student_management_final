package com.example.student_management_api.subject;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.department.Department;
import com.example.student_management_api.department.DepartmentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository subjects;
    private final DepartmentRepository departments;

    public SubjectService(SubjectRepository subjects, DepartmentRepository departments) {
        this.subjects = subjects;
        this.departments = departments;
    }

    public List<SubjectResponse> list(String search, Long departmentId, String status) {
        String q = Text.normalizeQuery(search);
        Subject.Status subjectStatus = Text.parseEnum(
                Subject.Status.class, status, "Trạng thái môn học không hợp lệ");

        return subjects.findAllWithDepartment().stream()
                .filter(s -> q.isEmpty()
                        || Text.containsIgnoreCase(s.getSubjectCode(), q)
                        || Text.containsIgnoreCase(s.getName(), q)
                        || (s.getDepartment() != null
                                && (Text.containsIgnoreCase(s.getDepartment().getDepartmentCode(), q)
                                || Text.containsIgnoreCase(s.getDepartment().getName(), q))))
                .filter(s -> departmentId == null
                        || (s.getDepartment() != null && departmentId.equals(s.getDepartment().getId())))
                .filter(s -> subjectStatus == null || s.getStatus() == subjectStatus)
                .map(SubjectResponse::from)
                .toList();
    }

    public SubjectResponse get(Long id) {
        return SubjectResponse.from(find(id));
    }

    @Transactional
    public SubjectResponse create(Actor actor, SubjectRequest request) {
        actor.requireAdmin();
        Subject subject = new Subject();
        apply(subject, request, null);
        return SubjectResponse.from(subjects.saveAndFlush(subject));
    }

    @Transactional
    public SubjectResponse update(Actor actor, Long id, SubjectRequest request) {
        actor.requireAdmin();
        Subject subject = find(id);
        apply(subject, request, id);
        return SubjectResponse.from(subject);
    }

    @Transactional
    public void delete(Actor actor, Long id) {
        actor.requireAdmin();
        subjects.delete(find(id));
        subjects.flush();
    }

    private Subject find(Long id) {
        return subjects.findWithDepartmentById(id)
                .orElseThrow(() -> Text.notFound("Không tìm thấy môn học"));
    }

    private void apply(Subject subject, SubjectRequest request, Long selfId) {
        String code = request.subjectCode().trim().toUpperCase();
        subjects.findBySubjectCodeIgnoreCase(code).ifPresent(existing -> {
            if (!existing.getId().equals(selfId)) {
                throw Text.conflict("Mã môn học " + code + " đã tồn tại");
            }
        });

        Department department = departments.findById(request.departmentId())
                .orElseThrow(() -> Text.badRequest("Khoa không tồn tại"));
        if (department.getStatus() != Department.Status.ACTIVE) {
            throw Text.badRequest("Không thể gán môn học vào khoa đã ngừng hoạt động");
        }

        Subject.Status status = Text.parseEnum(
                Subject.Status.class, request.status(), "Trạng thái môn học không hợp lệ");

        subject.setSubjectCode(code);
        subject.setName(request.name().trim());
        subject.setDepartment(department);
        subject.setCredits(request.credits());
        subject.setDescription(Text.blankToNull(request.description()));
        if (status != null) {
            subject.setStatus(status);
        }
    }
}
