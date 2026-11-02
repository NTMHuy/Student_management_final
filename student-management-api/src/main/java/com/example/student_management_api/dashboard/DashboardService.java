package com.example.student_management_api.dashboard;
import com.example.student_management_api.auth.Actor;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class DashboardService {
 private final JdbcTemplate jdbc;
 public DashboardService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public DashboardResponse summary(Actor actor){
  boolean admin=actor.isAdmin();
  Long teacherId=actor.teacherId();
  if(!admin&&teacherId==null) return empty();
  String scope=admin?"":" AND EXISTS (SELECT 1 FROM enrollments e JOIN teaching_assignments ta ON ta.course_section_id=e.course_section_id WHERE e.student_id=s.id AND ta.teacher_id=?)";
  Object[] args=admin?new Object[]{}:new Object[]{teacherId};
  long total=jdbc.queryForObject("SELECT count(*) FROM students s WHERE s.student_class_id IS NOT NULL"+scope,Long.class,args);
  long active=countStatus("ACTIVE",scope,args),suspended=countStatus("SUSPENDED",scope,args),transferred=countStatus("TRANSFERRED",scope,args);
  Long teachers=admin?jdbc.queryForObject("SELECT count(*) FROM teachers",Long.class):null;
  Long departments=admin?jdbc.queryForObject("SELECT count(*) FROM departments",Long.class):null;
  String classScope=admin?"":" AND EXISTS (SELECT 1 FROM students s WHERE s.student_class_id=sc.id AND EXISTS (SELECT 1 FROM enrollments e JOIN teaching_assignments ta ON ta.course_section_id=e.course_section_id WHERE e.student_id=s.id AND ta.teacher_id=?))";
  long totalClasses=admin?jdbc.queryForObject("SELECT count(*) FROM student_classes",Long.class):jdbc.queryForObject("SELECT count(*) FROM student_classes sc WHERE EXISTS (SELECT 1 FROM students s JOIN enrollments e ON e.student_id=s.id JOIN teaching_assignments ta ON ta.course_section_id=e.course_section_id WHERE s.student_class_id=sc.id AND ta.teacher_id=?)",Long.class,teacherId);
  List<DashboardResponse.StudentClassRow> classes=jdbc.query("""
   SELECT sc.id,sc.class_code,sc.class_name,m.name major_name,d.name department_name,sc.intake_year,
    (SELECT count(*) FROM students s WHERE s.student_class_id=sc.id) student_count
   FROM student_classes sc JOIN majors m ON m.id=sc.major_id JOIN departments d ON d.id=m.department_id
   WHERE 1=1
   """+classScope+" ORDER BY sc.intake_year DESC,sc.class_code LIMIT 10",
   (rs,n)->new DashboardResponse.StudentClassRow(String.valueOf(rs.getLong("id")),rs.getString("class_code"),rs.getString("class_name"),rs.getString("major_name"),rs.getString("department_name"),rs.getInt("intake_year"),rs.getInt("student_count")),
   admin?new Object[]{}:new Object[]{teacherId});
  String recentScope=admin?"":" AND EXISTS (SELECT 1 FROM enrollments e JOIN teaching_assignments ta ON ta.course_section_id=e.course_section_id WHERE e.student_id=s.id AND ta.teacher_id=?)";
  List<DashboardResponse.RecentStudent> recent=jdbc.query("""
   SELECT s.id,s.student_code,s.full_name,sc.class_name,s.created_at
   FROM students s LEFT JOIN student_classes sc ON sc.id=s.student_class_id
   WHERE s.student_class_id IS NOT NULL
   """+recentScope+" ORDER BY s.created_at DESC LIMIT 5",
   (rs,n)->new DashboardResponse.RecentStudent(String.valueOf(rs.getLong("id")),rs.getString("student_code"),rs.getString("full_name"),rs.getString("class_name"),rs.getTimestamp("created_at")==null?"":rs.getTimestamp("created_at").toInstant().toString()),
   admin?new Object[]{}:new Object[]{teacherId});
  return new DashboardResponse(total,teachers,departments,totalClasses,new DashboardResponse.StudentsByStatus(active,suspended,transferred),classes,recent);
 }
 private long countStatus(String status,String scope,Object[] args){
  String sql="SELECT count(*) FROM students s WHERE s.student_class_id IS NOT NULL AND s.status=?"+scope;
  if(args.length==0)return jdbc.queryForObject(sql,Long.class,status);
  return jdbc.queryForObject(sql,Long.class,status,args[0]);
 }
 private DashboardResponse empty(){return new DashboardResponse(0,null,null,0,new DashboardResponse.StudentsByStatus(0,0,0),List.of(),List.of());}
}
