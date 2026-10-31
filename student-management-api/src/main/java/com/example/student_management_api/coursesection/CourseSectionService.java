package com.example.student_management_api.coursesection;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.semester.Semester;
import com.example.student_management_api.semester.SemesterRepository;
import com.example.student_management_api.subject.Subject;
import com.example.student_management_api.subject.SubjectRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly=true)
public class CourseSectionService {
    private final CourseSectionRepository sections;
    private final SubjectRepository subjects;
    private final SemesterRepository semesters;
    public CourseSectionService(CourseSectionRepository sections,SubjectRepository subjects,SemesterRepository semesters){
        this.sections=sections;this.subjects=subjects;this.semesters=semesters;
    }
    public List<CourseSectionResponse> list(Long semesterId,Long subjectId,String search){
        String q=Text.normalizeQuery(search);
        return sections.findAll().stream()
            .filter(c->semesterId==null||c.getSemester().getId().equals(semesterId))
            .filter(c->subjectId==null||c.getSubject().getId().equals(subjectId))
            .filter(c->q.isEmpty()||Text.containsIgnoreCase(c.getSectionCode(),q)
                ||Text.containsIgnoreCase(c.getSectionName(),q)||Text.containsIgnoreCase(c.getSubject().getName(),q))
            .map(CourseSectionResponse::from).toList();
    }
    public CourseSectionResponse get(Long id){return CourseSectionResponse.from(find(id));}
    @Transactional
    public CourseSectionResponse create(Actor actor,CourseSectionRequest request){
        actor.requireAdmin();CourseSection c=new CourseSection();apply(c,request,null);
        return CourseSectionResponse.from(sections.saveAndFlush(c));
    }
    @Transactional
    public CourseSectionResponse update(Actor actor,Long id,CourseSectionRequest request){
        actor.requireAdmin();CourseSection c=find(id);apply(c,request,id);return CourseSectionResponse.from(c);
    }
    @Transactional
    public void delete(Actor actor,Long id){actor.requireAdmin();sections.delete(find(id));sections.flush();}
    private CourseSection find(Long id){return sections.findById(id).orElseThrow(()->Text.notFound("Không tìm thấy lớp học phần"));}
    private void apply(CourseSection c,CourseSectionRequest r,Long selfId){
        String code=r.sectionCode().trim().toUpperCase();
        sections.findBySemesterIdAndSectionCode(r.semesterId(),code).ifPresent(existing->{
            if(!existing.getId().equals(selfId))throw Text.conflict("Mã lớp học phần đã tồn tại trong học kỳ");
        });
        BigDecimal sum=r.processWeight().add(r.midtermWeight()).add(r.finalWeight());
        if(sum.compareTo(new BigDecimal("100.00"))!=0)throw Text.badRequest("Tổng trọng số điểm phải bằng 100%");
        Subject subject=subjects.findById(r.subjectId()).orElseThrow(()->Text.badRequest("Môn học không tồn tại"));
        Semester semester=semesters.findById(r.semesterId()).orElseThrow(()->Text.badRequest("Học kỳ không tồn tại"));
        CourseSection.Status status=Text.parseEnum(CourseSection.Status.class,r.status(),"Trạng thái lớp học phần không hợp lệ");
        c.setSubject(subject);c.setSemester(semester);c.setSectionCode(code);
        c.setSectionName(Text.blankToNull(r.sectionName()));c.setCapacity(r.capacity());
        c.setProcessWeight(r.processWeight());c.setMidtermWeight(r.midtermWeight());c.setFinalWeight(r.finalWeight());
        if(status!=null)c.setStatus(status);
    }
}