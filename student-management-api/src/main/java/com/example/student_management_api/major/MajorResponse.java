package com.example.student_management_api.major;

import com.example.student_management_api.common.Text;

public record MajorResponse(String id, String majorCode, String name, String description, String status,
    String departmentId, String departmentCode, String departmentName) {
    public static MajorResponse from(Major m) {
        return new MajorResponse(String.valueOf(m.getId()), m.getMajorCode(), m.getName(),
            Text.nullToEmpty(m.getDescription()), Text.lower(m.getStatus()),
            String.valueOf(m.getDepartment().getId()), m.getDepartment().getDepartmentCode(), m.getDepartment().getName());
    }
}