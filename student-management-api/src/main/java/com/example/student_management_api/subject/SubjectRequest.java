package com.example.student_management_api.subject;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubjectRequest(
        @NotBlank(message = "Vui lòng nhập mã môn học")
        @Size(max = 20, message = "Mã môn học tối đa 20 ký tự")
        String subjectCode,

        @NotBlank(message = "Vui lòng nhập tên môn học")
        @Size(max = 100, message = "Tên môn học tối đa 100 ký tự")
        String name,

        @NotNull(message = "Vui lòng chọn khoa quản lý")
        Long departmentId,

        @NotNull(message = "Vui lòng nhập số tín chỉ")
        @Min(value = 1, message = "Số tín chỉ phải lớn hơn 0")
        Short credits,

        String description,
        String status) {
}
