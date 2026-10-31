package com.example.student_management_api.semester;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly=true)
public class SemesterService {
    private final SemesterRepository semesters;
    public SemesterService(SemesterRepository semesters){this.semesters=semesters;}
    public List<SemesterResponse> list(){
        return semesters.findAll().stream().sorted(Comparator.comparing(Semester::getStartDate).reversed())
            .map(SemesterResponse::from).toList();
    }
    public SemesterResponse get(Long id){return SemesterResponse.from(find(id));}
    @Transactional
    public SemesterResponse create(Actor actor,SemesterRequest request){
        actor.requireAdmin(); Semester s=new Semester(); apply(s,request,null);
        return SemesterResponse.from(semesters.saveAndFlush(s));
    }
    @Transactional
    public SemesterResponse update(Actor actor,Long id,SemesterRequest request){
        actor.requireAdmin(); Semester s=find(id); apply(s,request,id); return SemesterResponse.from(s);
    }
    @Transactional
    public void delete(Actor actor,Long id){actor.requireAdmin();semesters.delete(find(id));semesters.flush();}
    private Semester find(Long id){return semesters.findById(id).orElseThrow(()->Text.notFound("Không tìm thấy học kỳ"));}
    private void apply(Semester s,SemesterRequest r,Long selfId){
        String year=r.academicYear().trim();
        if(!year.matches("^(19|20|21)\\d{2}-(19|20|21)\\d{2}$")) throw Text.badRequest("Năm học phải có định dạng YYYY-YYYY");
        int start=Integer.parseInt(year.substring(0,4)), end=Integer.parseInt(year.substring(5));
        if(end!=start+1) throw Text.badRequest("Năm học kết thúc phải bằng năm bắt đầu cộng 1");
        if(!r.endDate().isAfter(r.startDate())) throw Text.badRequest("Ngày kết thúc phải sau ngày bắt đầu");
        semesters.findByAcademicYearAndTermNumber(year,r.termNumber()).ifPresent(existing->{
            if(!existing.getId().equals(selfId)) throw Text.conflict("Học kỳ trong năm học đã tồn tại");
        });
        Semester.Status status=Text.parseEnum(Semester.Status.class,r.status(),"Trạng thái học kỳ không hợp lệ");
        s.setAcademicYear(year);s.setTermNumber(r.termNumber());s.setName(r.name().trim());
        s.setStartDate(r.startDate());s.setEndDate(r.endDate());if(status!=null)s.setStatus(status);
    }
}