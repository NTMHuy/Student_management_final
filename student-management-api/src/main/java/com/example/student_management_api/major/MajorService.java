package com.example.student_management_api.major;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.department.Department;
import com.example.student_management_api.department.DepartmentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MajorService {
    private final MajorRepository majors;
    private final DepartmentRepository departments;
    public MajorService(MajorRepository majors, DepartmentRepository departments) {
        this.majors = majors; this.departments = departments;
    }
    public List<MajorResponse> list(String search, Long departmentId) {
        String q = Text.normalizeQuery(search);
        List<Major> rows = departmentId == null ? majors.findAll() : majors.findAllByDepartmentId(departmentId);
        return rows.stream().filter(m -> q.isEmpty() || Text.containsIgnoreCase(m.getMajorCode(), q)
            || Text.containsIgnoreCase(m.getName(), q) || Text.containsIgnoreCase(m.getDepartment().getName(), q))
            .map(MajorResponse::from).toList();
    }
    public MajorResponse get(Long id) { return MajorResponse.from(find(id)); }
    @Transactional
    public MajorResponse create(Actor actor, MajorRequest request) {
        actor.requireAdmin(); Major m = new Major(); apply(m, request, null);
        return MajorResponse.from(majors.saveAndFlush(m));
    }
    @Transactional
    public MajorResponse update(Actor actor, Long id, MajorRequest request) {
        actor.requireAdmin(); Major m = find(id); apply(m, request, id); return MajorResponse.from(m);
    }
    @Transactional
    public void delete(Actor actor, Long id) { actor.requireAdmin(); majors.delete(find(id)); majors.flush(); }
    private Major find(Long id) { return majors.findById(id).orElseThrow(() -> Text.notFound("Không tìm thấy ngành")); }
    private void apply(Major m, MajorRequest r, Long selfId) {
        String code = r.majorCode().trim().toUpperCase();
        majors.findByMajorCode(code).ifPresent(existing -> {
            if (!existing.getId().equals(selfId)) throw Text.conflict("Mã ngành đã tồn tại");
        });
        Department d = departments.findById(r.departmentId()).orElseThrow(() -> Text.badRequest("Khoa không tồn tại"));
        Major.Status status = Text.parseEnum(Major.Status.class, r.status(), "Trạng thái ngành không hợp lệ");
        m.setDepartment(d); m.setMajorCode(code); m.setName(r.name().trim());
        m.setDescription(Text.blankToNull(r.description()));
        if (status != null) m.setStatus(status);
    }
}