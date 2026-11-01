package com.example.student_management_api.coursesession;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record CourseSessionRequest(
    @NotNull(message = "Vui lòng chọn lớp học phần") Long courseSectionId,
    @NotNull(message = "Vui lòng chọn ngày học") LocalDate sessionDate,
    @NotNull(message = "Vui lòng chọn giờ bắt đầu") LocalTime startTime,
    @NotNull(message = "Vui lòng chọn giờ kết thúc") LocalTime endTime,
    @Size(max = 100) String room,
    String status
) {}
