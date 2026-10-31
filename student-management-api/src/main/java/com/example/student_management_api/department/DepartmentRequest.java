package com.example.student_management_api.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentRequest(
    @NotBlank(message = "Vui lòng nhập mã khoa") @Size(max = 20, message = "Mã khoa tối đa 20 ký tự") String departmentCode,
    @NotBlank(message = "Vui lòng nhập tên khoa") @Size(max = 150, message = "Tên khoa tối đa 150 ký tự") String name,
    String description,
    String status
) {}