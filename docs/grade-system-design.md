# Thiết kế nâng cấp hệ thống điểm sinh viên

> Trạng thái: Đã chốt nghiệp vụ, chưa triển khai migration lên Railway.
> Phạm vi: Nâng cấp chức năng điểm hiện tại theo hướng quản lý sinh viên; không xây dựng hệ thống đào tạo đại học đầy đủ.

## 1. Quyết định nghiệp vụ đã xác nhận

- Mỗi điểm tổng kết được xác định theo sinh viên, lớp, môn học, năm học và học kỳ.
- Mỗi môn học có một bộ trọng số cấu hình chung, dùng cho mọi lớp và học kỳ.
- Ba thành phần điểm: quá trình, giữa kỳ và cuối kỳ.
- Điểm quá trình có nhiều lần đánh giá; hệ thống tự tính trung bình cộng các lần có điểm.
- Giữa kỳ và cuối kỳ mỗi thành phần có một điểm.
- Điểm thành phần nằm trong thang 0–10.
- Trọng số là phần trăm; tổng ba trọng số bắt buộc bằng 100%.
- Điểm tổng kết làm tròn 2 chữ số thập phân theo HALF_UP.
- Không tính điểm tổng kết khi thiếu một trong ba thành phần.
- Khi trọng số môn học thay đổi, kết quả đã được tạo trước đó không thay đổi. Kết quả mới dùng bộ trọng số mới.

## 2. Công thức

Điểm quá trình là trung bình cộng của các lần đánh giá PROCESS có điểm.

Điểm tổng kết:

`(Điểm quá trình × Trọng số quá trình + Điểm giữa kỳ × Trọng số giữa kỳ + Điểm cuối kỳ × Trọng số cuối kỳ) / 100`

Ví dụ bộ trọng số 30% – 30% – 40%, các điểm thành phần lần lượt 8.00, 7.00, 9.00 thì điểm tổng kết là 8.10.

## 3. Mô hình dữ liệu mục tiêu

### subjects

Bổ sung ba cột cấu hình trọng số:

- `process_weight NUMERIC(5,2)`
- `midterm_weight NUMERIC(5,2)`
- `final_weight NUMERIC(5,2)`

Giá trị khởi tạo đề xuất: 30, 30, 40. Cần kiểm tra tổng trọng số bằng 100 ở tầng service và ràng buộc DB phù hợp.

### grade_records

Tiếp tục lưu điểm thành phần, điều chỉnh loại đánh giá còn:

- `PROCESS`: nhiều bản ghi cho một sinh viên/môn/năm học/học kỳ; `assessment_number` là số thứ tự lần đánh giá.
- `MIDTERM`: một bản ghi.
- `FINAL`: một bản ghi.

Mỗi bản ghi có điểm 0–10, giảng viên nhập, ghi chú và thời điểm tạo/cập nhật. Ràng buộc duy nhất cần phản ánh loại đánh giá và số lần đánh giá.

### grade_results

Lưu kết quả tổng kết đã chốt cho một sinh viên/môn/năm học/học kỳ, gồm:

- Điểm quá trình trung bình, điểm giữa kỳ, điểm cuối kỳ.
- Ba trọng số đã áp dụng (snapshot).
- Điểm tổng kết đã làm tròn 2 chữ số.
- Thời điểm tính kết quả.

Khi điểm thành phần thay đổi sau khi kết quả đã được tạo, tính lại bằng chính snapshot trọng số đang lưu. Khi môn học thay đổi trọng số, không ghi đè snapshot của kết quả đã tồn tại. Với kết quả chưa từng được tạo, dùng trọng số hiện tại của môn tại lần đầu đủ ba thành phần.

## 4. Quy tắc nhập và tính điểm

- PROCESS: cho phép thêm/sửa/xóa nhiều lần đánh giá. Không giới hạn số lần ở mức nghiệp vụ; giao diện có thể phân trang hoặc nhóm danh sách khi cần.
- MIDTERM và FINAL: chỉ một bản ghi mỗi loại trong một kỳ.
- Số thứ tự PROCESS phải duy nhất trong phạm vi sinh viên + môn + năm học + học kỳ + loại PROCESS.
- Không nhận điểm nhỏ hơn 0 hoặc lớn hơn 10.
- Không nhận bộ trọng số âm hoặc tổng khác 100%.
- Dùng BigDecimal ở backend; không dùng số dấu phẩy động để tính kết quả chính thức.
- Làm tròn kết quả tổng kết ở bước lưu kết quả, không làm tròn trung bình quá trình trước khi tính tổng kết trừ khi nghiệp vụ được điều chỉnh.

## 5. Phân quyền

- ADMIN được quản lý cấu hình môn học và xem/quản lý điểm.
- TEACHER chỉ được xem/nhập điểm khi có phân công đúng cặp lớp + môn trong `teacher_class_subjects`.
- Backend tiếp tục là nơi kiểm tra quyền; không chỉ dựa vào bộ lọc giao diện.

## 6. Tương thích dữ liệu điểm cũ

Schema hiện tại dùng các loại `ORAL`, `FIFTEEN_MIN`, `ONE_PERIOD`, `MIDTERM`, `FINAL`.

- Ba loại ORAL/FIFTEEN_MIN/ONE_PERIOD có thể chuyển thành các lần PROCESS riêng; cần đánh lại số thứ tự để tránh trùng số lần.
- MIDTERM/FINAL cũ có thể có nhiều assessment_number. Trước khi chuyển sang quy tắc một điểm giữa kỳ/cuối kỳ, phải kiểm kê dữ liệu thực tế và xác định cách bảo toàn các bản ghi trùng loại. Không tự ý ghi đè, xóa hoặc lấy trung bình các bản ghi cũ.
- Migration phải chạy theo hướng không mất dữ liệu; sao lưu và kiểm tra số lượng bản ghi trước/sau.
- Không chạy migration trên Railway production trong giai đoạn thiết kế.

## 7. Lộ trình triển khai

1. Hoàn thiện schema migration tương thích dữ liệu cũ.
2. Cập nhật Subject entity/request/response/service để quản lý trọng số.
3. Xây dựng API điểm thành phần và kết quả tổng kết; giữ nguyên kiểm tra phân công lớp–môn.
4. Cập nhật giao diện nhập nhiều lần điểm quá trình, điểm giữa kỳ/cuối kỳ và hiển thị công thức/trọng số.
5. Cập nhật xuất CSV, thống kê và các thẻ tổng quan theo cấu trúc mới.
6. Chạy kiểm tra backend/frontend, kiểm tra migration trên bản sao database trước khi triển khai Railway.

## 8. Phạm vi chưa mở rộng

Không bổ sung đăng ký học phần, tín chỉ, tiên quyết, chương trình đào tạo, xung đột thời khóa biểu, khoa/ngành hoặc quy trình học vụ đại học đầy đủ.
