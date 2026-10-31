package com.example.student_management_api.studentclass;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StudentClassRequest(
    @NotNull(message = "Vui lòng chọn ngành") Long majorId,
    @NotBlank(message = "Vui lòng nhập mã lớp sinh viên") @Size(max = 20, message = "Mã lớp tối đa 20 ký tự") String classCode,
    @NotBlank(message = "Vui lòng nhập tên lớp sinh viên") @Size(max = 100, message = "Tên lớp tối đa 100 ký tự") String className,
    @NotNull(message = "Vui lòng nhập năm tuyển sinh") @Min(value = 2000) @Max(value = 2200) Short intakeYear,
    String status
) {}