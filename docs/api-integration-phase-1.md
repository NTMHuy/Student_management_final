# API integration — Phase 1

This branch connects the Next.js frontend to the Spring Boot REST API. The changes are intentionally isolated from `main` pending review.

## Local configuration

Frontend: create `student-management-fe/student-management-main/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

The base URL is the backend origin only; API paths already include `/api`.

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

## Important notes

- The role selector on the login screen is a UI affordance; the server is authoritative for the account role. Client-side role switching does not grant permissions.
- Grades and attendance currently have frontend endpoint constants, but the backend controllers were not found during this phase. Those screens must not be considered API-integrated yet.
- Class management is still using mock data. Dashboard sections beyond the headline counts (attendance, academic distribution, sample class table, notices/reminders) are still static and must not be interpreted as live data.
- Cross-origin production deployment needs cookie/CORS review. The current backend cookie uses SameSite=Lax; if frontend and API are on different sites, cookie policy and CSRF protection must be designed together rather than simply changing CORS.
