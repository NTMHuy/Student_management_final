package com.example.student_management_api.student;

import com.example.student_management_api.common.Text;

/** Response hồ sơ sinh viên đại học. */
public record StudentResponse(
        String id,
        String studentCode,
        String fullName,
        String dateOfBirth,
        String gender,
        Long studentClassId,
        String studentClassCode,
        String studentClassName,
        String majorName,
        String email,
        String phone,
        String notes,
        String status,
        String avatarInitials) {

    public static StudentResponse from(Student s) {
        return new StudentResponse(
                String.valueOf(s.getId()),
                s.getStudentCode(),
                s.getFullName(),
                s.getDateOfBirth().toString(),
                Text.lower(s.getGender()),
                s.getStudentClass().getId(),
                s.getStudentClass().getClassCode(),
                s.getStudentClass().getClassName(),
                s.getStudentClass().getMajor().getName(),
                Text.nullToEmpty(s.getEmail()),
                Text.nullToEmpty(s.getPhone()),
                Text.nullToEmpty(s.getNotes()),
                Text.lower(s.getStatus()),
                Text.initials(s.getFullName(), "SV"));
    }
}