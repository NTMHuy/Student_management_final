package com.example.student_management_api.subject;

import com.example.student_management_api.common.Text;

public record SubjectResponse(
        String id,
        String subjectCode,
        String name,
        Long departmentId,
        String departmentCode,
        String departmentName,
        Short credits,
        String status,
        String description) {

    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(
                String.valueOf(subject.getId()),
                subject.getSubjectCode(),
                subject.getName(),
                subject.getDepartment() == null ? null : subject.getDepartment().getId(),
                subject.getDepartment() == null ? null : subject.getDepartment().getDepartmentCode(),
                subject.getDepartment() == null ? null : subject.getDepartment().getName(),
                subject.getCredits(),
                Text.lower(subject.getStatus()),
                Text.nullToEmpty(subject.getDescription()));
    }
}
