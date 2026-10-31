package com.example.student_management_api.studentclass;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.major.Major;
import com.example.student_management_api.major.MajorRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StudentClassService {
    private final StudentClassRepository classes;
    private final MajorRepository majors;
    public StudentClassService(StudentClassRepository classes, MajorRepository majors) {
        this.classes=classes; this.majors=majors;
    }
    public List<StudentClassResponse> list(String search, Long majorId, Short intakeYear) {
        String q=Text.normalizeQuery(search);
        return classes.findAll().stream()
            .filter(c -> majorId==null || c.getMajor().getId().equals(majorId))
            .filter(c -> intakeYear==null || c.getIntakeYear().equals(intakeYear))
            .filter(c -> q.isEmpty() || Text.containsIgnoreCase(c.getClassCode(),q)
                || Text.containsIgnoreCase(c.getClassName(),q) || Text.containsIgnoreCase(c.getMajor().getName(),q))
            .map(StudentClassResponse::from).toList();
    }
    public StudentClassResponse get(Long id) { return StudentClassResponse.from(find(id)); }
    @Transactional
    public StudentClassResponse create(Actor actor, StudentClassRequest request) {
        actor.requireAdmin(); StudentClass c=new StudentClass(); apply(c,request,null);
        return StudentClassResponse.from(classes.saveAndFlush(c));
    }
    @Transactional
    public StudentClassResponse update(Actor actor, Long id, StudentClassRequest request) {
        actor.requireAdmin(); StudentClass c=find(id); apply(c,request,id); return StudentClassResponse.from(c);
    }
    @Transactional
    public void delete(Actor actor, Long id) { actor.requireAdmin(); classes.delete(find(id)); classes.flush(); }
    private StudentClass find(Long id) {
        return classes.findById(id).orElseThrow(() -> Text.notFound("Không tìm thấy lớp sinh viên"));
    }
    private void apply(StudentClass c, StudentClassRequest r, Long selfId) {
        String code=r.classCode().trim().toUpperCase();
        classes.findByClassCode(code).ifPresent(existing -> {
            if(!existing.getId().equals(selfId)) throw Text.conflict("Mã lớp sinh viên đã tồn tại");
        });
        Major major=majors.findById(r.majorId()).orElseThrow(() -> Text.badRequest("Ngành không tồn tại"));
        StudentClass.Status status=Text.parseEnum(StudentClass.Status.class,r.status(),"Trạng thái lớp không hợp lệ");
        c.setMajor(major); c.setClassCode(code); c.setClassName(r.className().trim()); c.setIntakeYear(r.intakeYear());
        if(status!=null) c.setStatus(status);
    }
}