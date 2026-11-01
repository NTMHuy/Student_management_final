package com.example.student_management_api.enrollment;

import jakarta.validation.constraints.NotNull;

public record EnrollmentRequest(
    @NotNull(message = "Vui lòng chọn sinh viên") Long studentId,
    @NotNull(message = "Vui lòng chọn lớp học phần") Long courseSectionId
) {}
