package com.example.student_management_api.semester;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record SemesterRequest(
    @NotBlank(message="Vui lòng nhập năm học") @Size(min=9,max=9,message="Năm học có định dạng YYYY-YYYY") String academicYear,
    @NotNull(message="Vui lòng chọn học kỳ") @Min(1) @Max(3) Short termNumber,
    @NotBlank(message="Vui lòng nhập tên học kỳ") @Size(max=100) String name,
    @NotNull(message="Vui lòng chọn ngày bắt đầu") LocalDate startDate,
    @NotNull(message="Vui lòng chọn ngày kết thúc") LocalDate endDate,
    String status
) {}