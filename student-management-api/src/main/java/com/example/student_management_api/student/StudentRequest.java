package com.example.student_management_api.student;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Request tạo/cập nhật hồ sơ sinh viên đại học. */
public record StudentRequest(
        @NotBlank(message = "Vui lòng nhập họ tên")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự") String fullName,
        @NotNull(message = "Vui lòng chọn ngày sinh")
        @Past(message = "Ngày sinh phải ở trong quá khứ") LocalDate dateOfBirth,
        @NotBlank(message = "Vui lòng chọn giới tính") String gender,
        @NotNull(message = "Vui lòng chọn lớp sinh viên")
        @Positive(message = "Lớp sinh viên không hợp lệ") Long studentClassId,
        @Email(message = "Email sinh viên không hợp lệ")
        @Size(max = 255, message = "Email tối đa 255 ký tự") String email,
        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự") String phone,
        String notes,
        String status) {
}