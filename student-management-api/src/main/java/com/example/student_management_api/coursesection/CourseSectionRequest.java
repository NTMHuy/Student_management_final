package com.example.student_management_api.coursesection;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CourseSectionRequest(
    @NotNull(message="Vui lòng chọn môn học") Long subjectId,
    @NotNull(message="Vui lòng chọn học kỳ") Long semesterId,
    @NotBlank(message="Vui lòng nhập mã lớp học phần") @Size(max=30) String sectionCode,
    @Size(max=150) String sectionName,
    @NotNull(message="Vui lòng nhập sĩ số tối đa") @Min(1) @Max(1000) Integer capacity,
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal processWeight,
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal midtermWeight,
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal finalWeight,
    String status
) {}