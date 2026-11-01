package com.example.student_management_api.enrollment;

import com.example.student_management_api.common.Text;

public record EnrollmentResponse(
    String id,
    String studentId,
    String studentCode,
    String studentName,
    String courseSectionId,
    String sectionCode,
    String subjectCode,
    String subjectName,
    String semesterName,
    String status,
    String enrolledAt,
    String withdrawnAt
) {
    public static EnrollmentResponse from(Enrollment e) {
        return new EnrollmentResponse(
            String.valueOf(e.getId()),
            String.valueOf(e.getStudent().getId()),
            e.getStudent().getStudentCode(),
            e.getStudent().getFullName(),
            String.valueOf(e.getCourseSection().getId()),
            e.getCourseSection().getSectionCode(),
            e.getCourseSection().getSubject().getSubjectCode(),
            e.getCourseSection().getSubject().getName(),
            e.getCourseSection().getSemester().getName(),
            Text.lower(e.getStatus()),
            e.getEnrolledAt() == null ? null : e.getEnrolledAt().toString(),
            e.getWithdrawnAt() == null ? null : e.getWithdrawnAt().toString()
        );
    }
}
