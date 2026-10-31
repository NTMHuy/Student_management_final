package com.example.student_management_api.department;

import com.example.student_management_api.common.Text;

public record DepartmentResponse(String id, String departmentCode, String name, String description, String status) {
    public static DepartmentResponse from(Department d) {
        return new DepartmentResponse(String.valueOf(d.getId()), d.getDepartmentCode(), d.getName(),
            Text.nullToEmpty(d.getDescription()), Text.lower(d.getStatus()));
    }
}