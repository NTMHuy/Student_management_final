package com.example.student_management_api.department;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DepartmentService {
    private final DepartmentRepository departments;
    public DepartmentService(DepartmentRepository departments) { this.departments = departments; }

    public List<DepartmentResponse> list(String search) {
        String q = Text.normalizeQuery(search);
        return departments.findAll().stream()
            .filter(d -> q.isEmpty() || Text.containsIgnoreCase(d.getDepartmentCode(), q)
                || Text.containsIgnoreCase(d.getName(), q))
            .map(DepartmentResponse::from).toList();
    }
    public DepartmentResponse get(Long id) { return DepartmentResponse.from(find(id)); }

    @Transactional
    public DepartmentResponse create(Actor actor, DepartmentRequest request) {
        actor.requireAdmin();
        Department d = new Department();
        apply(d, request, null);
        return DepartmentResponse.from(departments.saveAndFlush(d));
    }
    @Transactional
    public DepartmentResponse update(Actor actor, Long id, DepartmentRequest request) {
        actor.requireAdmin();
        Department d = find(id);
        apply(d, request, id);
        return DepartmentResponse.from(d);
    }
    @Transactional
    public void delete(Actor actor, Long id) {
        actor.requireAdmin();
        departments.delete(find(id));
        departments.flush();
    }
    private Department find(Long id) {
        return departments.findById(id).orElseThrow(() -> Text.notFound("Không tìm thấy khoa"));
    }
    private void apply(Department d, DepartmentRequest r, Long selfId) {
        String code = r.departmentCode().trim().toUpperCase();
        departments.findByDepartmentCode(code).ifPresent(existing -> {
            if (!existing.getId().equals(selfId)) throw Text.conflict("Mã khoa đã tồn tại");
        });
        Department.Status status = Text.parseEnum(Department.Status.class, r.status(), "Trạng thái khoa không hợp lệ");
        d.setDepartmentCode(code);
        d.setName(r.name().trim());
        d.setDescription(Text.blankToNull(r.description()));
        if (status != null) d.setStatus(status);
    }
}