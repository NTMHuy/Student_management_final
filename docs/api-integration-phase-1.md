# API integration — Phase 1

This branch connects the Next.js frontend to the Spring Boot REST API. The changes are intentionally isolated from `main` pending review.

## Local configuration

Frontend: không cần cấu hình gì khi chạy local. Trình duyệt chỉ gọi `/api/...` cùng origin và `src/proxy.ts` chuyển tiếp sang Spring Boot ở `BACKEND_URL` (mặc định `http://localhost:8080`). Nếu backend chạy ở địa chỉ khác, tạo `.env.local` với `BACKEND_URL=...`. Hãy xóa `NEXT_PUBLIC_API_URL` khỏi `.env.local` cũ (nếu có), biến này chỉ dùng khi muốn gọi thẳng API khác origin.

Backend: set these environment variables as appropriate for your local PostgreSQL instance and initial admin account:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/student-management-api
DB_USER=postgres
DB_PASSWORD=your-local-database-password
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
FRONTEND_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
```

Do not commit real secrets or `.env.local`. In production, use HTTPS, set `COOKIE_SECURE=true`, and configure `FRONTEND_ORIGIN` to the exact deployed frontend origin.

## What is connected

- Cookie-based login, current-session restoration (`GET /api/auth/me`), and logout.
- Student list/search/filter, details, create, update, and delete through `/api/students`.
- Teacher list/search/filter, details, create, update, and delete through `/api/teachers`.
- Subject list/search/filter, create, update, and delete through `/api/subjects`.
- Dashboard headline counts (students, teachers, classes, departments, classes by grade) load from `/api/dashboard/summary`.
- Frontend requests send credentials so the browser includes the backend's HttpOnly session cookie.
- Backend CORS permits credentials only from the configured frontend origin.

- Attendance (`/api/attendance`: per-class daily list, batch save, history, repeated-absence warnings) and grades (`/api/grades`: gradebook per class/subject/term, batch save) are persisted in PostgreSQL (migration V3). The class/subject pickers come from `/api/teaching-options`: admins see everything, teachers only their homeroom classes or assigned class/subject pairs (`/api/teaching-assignments`).
- Account settings page (`/settings`) changes the password through `POST /api/account/password`.

## Important notes

- The role selector on the login screen is a UI affordance; the server is authoritative for the account role. Client-side role switching does not grant permissions.
- Class management is still using mock data. Dashboard sections beyond the headline counts (attendance, academic distribution, sample class table, notices/reminders) are still static and must not be interpreted as live data.
- Cross-origin production deployment needs cookie/CORS review. The current backend cookie uses SameSite=Lax; if frontend and API are on different sites, cookie policy and CSRF protection must be designed together rather than simply changing CORS.
