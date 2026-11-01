package com.example.student_management_api.coursesession;

import com.example.student_management_api.common.Text;

public record CourseSessionResponse(
    String id, String courseSectionId, String sectionCode,
    String subjectCode, String subjectName, String sessionDate,
    String startTime, String endTime, String room, String status
) {
    public static CourseSessionResponse from(CourseSession s) {
        return new CourseSessionResponse(
            String.valueOf(s.getId()),
            String.valueOf(s.getCourseSection().getId()),
            s.getCourseSection().getSectionCode(),
            s.getCourseSection().getSubject().getSubjectCode(),
            s.getCourseSection().getSubject().getName(),
            s.getSessionDate().toString(),
            s.getStartTime().toString(),
            s.getEndTime().toString(),
            Text.nullToEmpty(s.getRoom()),
            Text.lower(s.getStatus())
        );
    }
}
