package com.example.student_management_api.studentclass;

import com.example.student_management_api.common.Text;

public record StudentClassResponse(String id, String classCode, String className, Short intakeYear,
    String status, String majorId, String majorCode, String majorName, String departmentName) {
    public static StudentClassResponse from(StudentClass c) {
        return new StudentClassResponse(String.valueOf(c.getId()), c.getClassCode(), c.getClassName(),
            c.getIntakeYear(), Text.lower(c.getStatus()), String.valueOf(c.getMajor().getId()),
            c.getMajor().getMajorCode(), c.getMajor().getName(), c.getMajor().getDepartment().getName());
    }
}