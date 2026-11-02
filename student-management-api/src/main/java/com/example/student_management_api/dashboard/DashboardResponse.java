package com.example.student_management_api.dashboard;
import java.util.List;
public record DashboardResponse(
 long totalStudents, Long totalTeachers, Long totalDepartments, long totalStudentClasses,
 StudentsByStatus studentsByStatus, List<StudentClassRow> studentClasses,
 List<RecentStudent> recentStudents) {
 public record StudentsByStatus(long active,long suspended,long transferred) {}
 public record StudentClassRow(String id,String classCode,String className,String majorName,
  String departmentName,int intakeYear,int studentCount) {}
 public record RecentStudent(String id,String studentCode,String fullName,String className,String createdAt) {}
}
