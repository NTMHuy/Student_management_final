package com.example.student_management_api.major;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MajorRequest(
    @NotNull(message = "Vui lòng chọn khoa") Long departmentId,
    @NotBlank(message = "Vui lòng nhập mã ngành") @Size(max = 20, message = "Mã ngành tối đa 20 ký tự") String majorCode,
    @NotBlank(message = "Vui lòng nhập tên ngành") @Size(max = 150, message = "Tên ngành tối đa 150 ký tự") String name,
    String description,
    String status
) {}