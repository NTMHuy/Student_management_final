package com.example.student_management_api.coursesection;

import com.example.student_management_api.common.Text;

public record CourseSectionResponse(String id,String sectionCode,String sectionName,Integer capacity,
    String status,String subjectId,String subjectCode,String subjectName,String semesterId,
    String semesterName,String academicYear,Short termNumber,String processWeight,String midtermWeight,String finalWeight) {
    public static CourseSectionResponse from(CourseSection c) {
        return new CourseSectionResponse(String.valueOf(c.getId()),c.getSectionCode(),
            Text.nullToEmpty(c.getSectionName()),c.getCapacity(),Text.lower(c.getStatus()),
            String.valueOf(c.getSubject().getId()),c.getSubject().getSubjectCode(),c.getSubject().getName(),
            String.valueOf(c.getSemester().getId()),c.getSemester().getName(),c.getSemester().getAcademicYear(),
            c.getSemester().getTermNumber(),c.getProcessWeight().toPlainString(),
            c.getMidtermWeight().toPlainString(),c.getFinalWeight().toPlainString());
    }
}