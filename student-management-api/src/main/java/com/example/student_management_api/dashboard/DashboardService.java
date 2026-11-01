package com.example.student_management_api.dashboard;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.student.Student;
import com.example.student_management_api.student.StudentRepository;
import com.example.student_management_api.studentclass.StudentClass;
import com.example.student_management_api.studentclass.StudentClassRepository;
import com.example.student_management_api.teacher.TeacherRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int MAX_CLASS_ROWS = 10;
    private static final int MAX_RECENT_STUDENTS = 5;

    private final StudentRepository students;
    private final StudentClassRepository studentClasses;
    private final TeacherRepository teachers;

    public DashboardService(
            StudentRepository students,
            StudentClassRepository studentClasses,
            TeacherRepository teachers) {
        this.students = students;
        this.studentClasses = studentClasses;
        this.teachers = teachers;
    }

    public DashboardResponse summary(Actor actor) {
        // Teaching-assignment based teacher scoping will be added with that module.
        // Until then, do not expose university-wide student data to teacher accounts.
        if (!actor.isAdmin()) {
            return new DashboardResponse(
                    0, null, null, 0,
                    new DashboardResponse.ClassesByGrade(0, 0, 0),
                    new DashboardResponse.StudentsByStatus(0, 0, 0),
                    List.of(), List.of());
        }

        List<Student> allStudents = students.findAllByOrderByStudentCode();
        List<StudentClass> allStudentClasses = studentClasses.findAll();

        Map<Long, Long> countByStudentClass = allStudents.stream()
                .filter(student -> student.getStudentClass() != null)
                .collect(Collectors.groupingBy(
                        student -> student.getStudentClass().getId(),
                        Collectors.counting()));

        DashboardResponse.StudentsByStatus byStatus = new DashboardResponse.StudentsByStatus(
                allStudents.stream().filter(s -> s.getStatus() == Student.Status.ACTIVE).count(),
                allStudents.stream().filter(s -> s.getStatus() == Student.Status.SUSPENDED).count(),
                allStudents.stream().filter(s -> s.getStatus() == Student.Status.TRANSFERRED).count());

        List<DashboardResponse.ClassRow> classRows = allStudentClasses.stream()
                .sorted(Comparator.comparing(StudentClass::getClassCode))
                .limit(MAX_CLASS_ROWS)
                .map(studentClass -> new DashboardResponse.ClassRow(
                        String.valueOf(studentClass.getId()),
                        studentClass.getClassName(),
                        0,
                        "",
                        countByStudentClass.getOrDefault(studentClass.getId(), 0L).intValue(),
                        0))
                .toList();

        List<DashboardResponse.RecentStudent> recent = allStudents.stream()
                .sorted(Comparator.comparing(
                        Student::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(MAX_RECENT_STUDENTS)
                .filter(s -> s.getStudentClass() != null)
                .map(s -> new DashboardResponse.RecentStudent(
                        String.valueOf(s.getId()),
                        s.getStudentCode(),
                        s.getFullName(),
                        s.getStudentClass().getClassName(),
                        Text.initials(s.getFullName(), "SV"),
                        s.getCreatedAt() == null ? "" : s.getCreatedAt().toString()))
                .toList();

        return new DashboardResponse(
                allStudents.size(),
                (long) teachers.count(),
                (long) allStudentClasses.stream()
                        .map(s -> s.getMajor().getDepartment().getId())
                        .distinct()
                        .count(),
                allStudentClasses.size(),
                new DashboardResponse.ClassesByGrade(0, 0, 0),
                byStatus,
                classRows,
                recent);
    }
}
