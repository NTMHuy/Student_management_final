# University Student Management – Transition Plan

## 1. Purpose

Transform the existing school student-management application into a university student-management application while preserving reusable infrastructure and avoiding an unnecessary full rewrite.

The GitHub `main` branch is the baseline. All transition work is performed on `feature/university-student-management`. Production Railway data is out of scope unless the project owner explicitly approves a separate migration plan.

## 2. Confirmed target domain

The application distinguishes two different academic groupings:

- **Student class (`student_classes`)**: a stable cohort/group such as `CNTT-K20A`. A student belongs to one student class at a time.
- **Course section (`course_sections`)**: a delivery of a subject in a semester, such as `Lập trình Java – Nhóm 01 – HK1`. A student may enroll in multiple course sections.

Grades, attendance, and teaching assignments are scoped to a course section. A subject is the catalog definition; a course section is a specific offering of that subject in a semester.

## 3. Confirmed academic rules

### Grades

- Score range: 0–10.
- Components: PROCESS, MIDTERM, FINAL.
- PROCESS accepts multiple attempts and is averaged.
- MIDTERM has one score; FINAL has one score.
- Component weights total 100%.
- Do not calculate/publish a final total until all required components have scores.
- Save a weight snapshot with the result so later changes to subject/course configuration do not rewrite historical results.
- Existing school-grade rows require an explicit reconciliation/migration policy before any production data migration.

### Roles and authorization

- Keep ADMIN and TEACHER as the initial roles.
- ADMIN manages academic catalog data, student records, student classes, semesters, course sections, enrollments, teachers, assignments, grades, and accounts.
- TEACHER can access only course sections assigned to that teacher and perform permitted teaching operations for those sections.
- Remove authorization based on homeroom-teacher ownership; use teaching assignments and course-section membership instead.

### Attendance

- Attendance belongs to a course section and should be recorded per course session.
- The current school-wide MORNING/AFTERNOON slot is not the target domain model.

## 4. Target domain model – working proposal

The following is a design proposal, not yet a final database contract:

- `users`
- `teachers`
- `students`
- `departments`
- `majors`
- `student_classes`
- `subjects`
- `semesters`
- `course_sections`
- `enrollments`
- `teaching_assignments`
- `course_sessions`
- `attendance_records`
- `grade_records`
- `grade_results`

The final design must define ownership, uniqueness, lifecycle/status values, deletion behavior, indexes, and authorization scope for every relationship before implementation migrations are written.

## 5. Existing application assessment

### Retain, with security review

- Spring Boot application structure and dependency management.
- JWT authentication, HttpOnly-cookie handling, password hashing, and account lookup.
- ADMIN / TEACHER roles as the initial role set.
- Shared API exception handling and common validation utilities.
- Next.js App Router, API client/proxy, authentication context, dashboard shell, shared UI components, and reusable table/form patterns.
- Teacher profile and account linkage, subject to department and assignment changes.

### Refactor

- Student entity, DTOs, service, repository, filters, and forms: remove parent-email and school-grade assumptions; link to a student class and university academic profile.
- Class module: split into student-class and course-section modules.
- Subject module: remove grade 10/11/12 periods and homeroom/head-teacher assumptions; model credits and academic department after the catalog rules are finalized.
- Teaching assignments: replace teacher + school class + subject with teacher + course section.
- Grade module: replace school assessment columns and class/subject/year parameters with course-section-based grade components and results.
- Attendance module: replace class/date/morning-afternoon records with course-session attendance.
- Dashboard: replace K-12 counts with university metrics.

### Remove from the target domain

- Grade levels 10/11/12 and school streams (KHTN/KHXH).
- Homeroom teacher and class-leader roles.
- Parent email as a core student field.
- Oral / 15-minute / one-period assessment types.
- School-specific dashboard aggregations.

## 6. API contract direction

The existing API paths may be kept where they remain semantically clear, but request/response contracts must change together with the frontend.

Proposed resource direction:

- `/api/students`
- `/api/student-classes`
- `/api/departments`
- `/api/majors`
- `/api/subjects`
- `/api/semesters`
- `/api/course-sections`
- `/api/enrollments`
- `/api/teaching-assignments`
- `/api/course-sections/{id}/sessions`
- `/api/attendance`
- `/api/grades`

These are target naming conventions; implementation must first inventory every current frontend caller and settle payload schemas.

## 7. Delivery sequence

1. Complete source/API contract inventory and record the retain/refactor/remove decisions.
2. Finalize university domain rules and database relationship design.
3. Write backend API contracts and frontend type contracts.
4. Implement database migrations on the feature branch only; do not run them against Railway production.
5. Implement backend domain entities, repositories, services, controllers, authorization, and tests.
6. Update frontend modules, routes, navigation, forms, tables, and API services.
7. Run backend tests/build and frontend lint/typecheck/build; fix integration mismatches.
8. Prepare a reviewable pull request into `main`; the project owner reviews and merges it.

## 8. Decisions still required before final schema

Do not silently assume these items:

- Whether departments and majors are separate entities and whether every major belongs to one department.
- Whether cohort/intake is represented by a dedicated entity or by year fields on student class.
- Academic-year and semester naming/ordering rules.
- Course-section capacity and enrollment open/close dates.
- Prerequisites and prerequisite enforcement.
- Enrollment lifecycle: active, withdrawn, completed, failed, repeated; and whether a student can enroll in the same subject more than once.
- Course-session timetable fields (weekday, start/end time, room) and whether schedule conflict detection is required.
- Whether the initial release needs GPA, letter grades, academic standing, or only 0–10 scores.
- How existing school data is retained, archived, transformed, or excluded from the university system.

## 9. Safety and compatibility constraints

- Never rewrite or delete historical migrations that may already have run.
- Use additive Flyway migrations for schema evolution.
- Do not assume the current migration set contains a completed university schema; the current `main` tree must be treated as authoritative and rechecked before writing migrations.
- Do not commit local configuration, credentials, generated build output, or environment-specific secrets.
- Do not modify Railway production data during this transition.


## 10. Backend implementation progress

The feature branch now contains initial JPA entities and repositories for:
- Department and major
- Student class
- Semester
- Course section
- Enrollment

Initial ADMIN-managed CRUD APIs have also been added for:
- `/api/departments`
- `/api/majors`
- `/api/student-classes`
- `/api/semesters`
- `/api/course-sections`

These are an initial vertical slice, not a completed backend release. In particular:
- Student CRUD still contains school-class/homeroom assumptions and must be refactored with backward-compatible handling for legacy records.
- Enrollment endpoints and transactional capacity enforcement are not implemented yet.
- Teaching assignment, course-session attendance, and university grade APIs are not implemented yet.
- The subject entity/API still contains school-specific fields and must be refactored without breaking the legacy schema during transition.
- Automated compilation, integration tests, and migration validation against PostgreSQL have not yet been run.
