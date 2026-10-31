# Triển khai lên Railway

Kiến trúc: 3 service trong **một project mới** — `Postgres`, `api` (Spring Boot) và `web` (Next.js).
Trình duyệt chỉ nói chuyện với `web`; `web` chuyển tiếp mọi request `/api/*` sang `api` qua mạng nội bộ
(`src/proxy.ts`). Nhờ vậy cookie đăng nhập là first-party và `api` không cần mở domain công khai.

## Biến môi trường

### Service `Postgres`
Railway tự tạo (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).

### Service `api` (Root Directory: `/student-management-api`)
| Biến | Giá trị |
|---|---|
| `PORT` | `8080` |
| `DB_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `DB_USER` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `JWT_SECRET` | chuỗi ngẫu nhiên dài (>= 32 ký tự), tạo bằng `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | email admin đầu tiên |
| `ADMIN_PASSWORD` | mật khẩu mạnh (chỉ dùng khi bảng `users` còn trống) |
| `COOKIE_SECURE` | `true` |

### Service `web` (Root Directory: `/student-management-fe/student-management-main`)
| Biến | Giá trị |
|---|---|
| `PORT` | `3000` |
| `BACKEND_URL` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}` |

Chỉ `web` cần **Generate Domain** (cổng 3000). Không tạo domain công khai cho `api`.

## Kiểm tra sau khi deploy
1. Log `api` có `Successfully applied ... to version 3` (Flyway) và `Started StudentManagementApiApplication`.
2. Mở domain của `web`, đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Tạo giáo viên, lớp, học sinh, môn học; thử điểm danh và nhập điểm; tải lại trang để chắc dữ liệu còn.

## Lỗi thường gặp
| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `api` báo `Found non-empty schema(s) "public" without schema history table` | Đang trỏ vào database cũ (của bản Prisma). Dùng Postgres mới trong project mới. |
| `api` crash vì `JWT_SECRET` | Chưa đặt hoặc quá ngắn. |
| Web hiện lỗi 502/500 khi gọi `/api` | `BACKEND_URL` sai, hoặc `api` chưa chạy. Kiểm tra log `api`, tên service phải đúng là `api`. |
| Đăng nhập xong bị đá về `/login` | Thiếu `COOKIE_SECURE=true` hoặc đang truy cập bằng `http` thay vì `https`. |
| "Application failed to respond" | `PORT` của service không khớp cổng đã Generate Domain (web: 3000). |
