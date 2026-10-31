package com.example.student_management_api.semester;

import com.example.student_management_api.common.Text;

public record SemesterResponse(String id,String academicYear,Short termNumber,String name,
    String startDate,String endDate,String status) {
    public static SemesterResponse from(Semester s) {
        return new SemesterResponse(String.valueOf(s.getId()),s.getAcademicYear(),s.getTermNumber(),
            s.getName(),s.getStartDate().toString(),s.getEndDate().toString(),Text.lower(s.getStatus()));
    }
}