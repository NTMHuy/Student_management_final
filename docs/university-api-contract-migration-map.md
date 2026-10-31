# University API Contract Migration Map

## Status

This document records the current API/frontend coupling found on `main` and the target contract direction for the university transition. It is an implementation map, not a claim that the target endpoints already exist.

All current contracts below were inspected on `main`. The feature branch must update backend and frontend callers together.

## 1. Existing contract inventory

| Area | Current API / payload | Current frontend dependency | University transition |
|---|---|---|---|
| Students | `/api/students`; filters `gradeLevel`, `className`; payload contains `dateOfBirth`, `parentEmail`, `gradeLevel`, `className` | `modules/student/services/student.service.ts`, student types and forms | Replace grade/class-name filters with `studentClassId`, `majorId`, `cohort` only if those concepts are approved; remove parent email; add university student profile fields |
| Classes | `/api/classes`; CRUD plus `/{id}/homeroom-teacher`, `/{id}/leaders` | `modules/class/services/class.service.ts`; class module pages/types | Split into `/api/student-classes` and `/api/course-sections`; remove homeroom and class leader endpoints |
| Subjects | `/api/subjects`; fields `department`, `evaluationType`, `grade10Periods`, `grade11Periods`, `grade12Periods`, `headTeacherId` | `modules/subject/services/subject.service.ts`, subject forms/types | Keep catalog CRUD; replace K-12 period fields with approved university catalog fields (e.g. credits); department should become a relation if departments are modeled |
| Teaching assignments | `/api/teaching-assignments`; `teacherId`, `classId`, `subjectId` | assignment pages and teaching service | Change assignment target to `teacherId` + `courseSectionId` |
| Teaching options | `/api/teaching-options`; `classes`, `subjects`, `pairs(classId, subjectId)` | `modules/teaching/services/teaching.service.ts` and grade/attendance pickers | Return authorized course sections and their enrolled students; avoid class/subject pair authorization |
| Grades | `/api/grades`; `classId`, `subjectId`, `schoolYear`, `semester`, assessment type/number | `modules/grade/services/grade.service.ts`; grade types and gradebook UI | Scope by `courseSectionId`; expose PROCESS attempts, MIDTERM, FINAL, component weights, computed result and completion state |
| Attendance | `/api/attendance`; `classId`, `date`, `session=MORNING/AFTERNOON`, optional `subjectId` | `modules/attendance/services/attendance.service.ts`; daily/history/warnings UI | Scope by `courseSectionId` and `courseSessionId`; retain statuses only if university policy approves them |
| Dashboard | `/api/dashboard/summary`; K-12 counts and classes-by-grade | dashboard page and response types | Replace K-12 aggregates with university metrics based on students, course sections, enrollment, attendance and grades |
| Authentication | `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`; HttpOnly JWT cookie | `lib/api/client.ts`, AuthContext and auth service | Retain cookie/JWT flow; review teacher-specific identity resolution as teaching staff authorization changes |

## 2. Current behavior that must not be carried forward

### Student access

The current student service authorizes teachers through the homeroom teacher of the student's school class. This is not valid for university teaching. The target authorization must be derived from active teaching assignments to course sections, with student access scoped to enrollments in those sections.

### Class and subject model

The current class module is one school class entity with grade level, stream, room, maximum student count, homeroom teacher, leaders, and embedded students. The target must separate the stable student cohort from a semester-specific course section. Do not map the current class table directly to course sections without splitting these responsibilities.

### Gradebook

The current frontend maps the first attempt of each school assessment type into five fixed columns and calculates an average client-side. This conflicts with the confirmed university rule that PROCESS has multiple attempts and is averaged, while MIDTERM and FINAL each have one score. The server must be authoritative for validation, weight snapshots, completion state, and final calculation.

### Attendance

The current attendance key is student + date + morning/afternoon session, and the record can optionally reference a subject. The target key should be based on a scheduled course session and student enrollment. Do not retain morning/afternoon as the primary session model.

## 3. Proposed target endpoint contracts

The following endpoint names are proposed. Exact DTO fields and HTTP methods must be finalized with the database design.

| Resource | Proposed operations |
|---|---|
| Students | `GET/POST /api/students`, `GET/PUT/DELETE /api/students/{id}` |
| Student classes | `GET/POST /api/student-classes`, `GET/PUT/DELETE /api/student-classes/{id}` |
| Departments | `GET/POST /api/departments`, `GET/PUT/DELETE /api/departments/{id}` |
| Majors | `GET/POST /api/majors`, `GET/PUT/DELETE /api/majors/{id}` |
| Subjects | `GET/POST /api/subjects`, `GET/PUT/DELETE /api/subjects/{id}` |
| Semesters | `GET/POST /api/semesters`, `GET/PUT/DELETE /api/semesters/{id}` |
| Course sections | `GET/POST /api/course-sections`, `GET/PUT/DELETE /api/course-sections/{id}` |
| Enrollments | `GET/POST /api/enrollments`, lifecycle actions for enroll/withdraw/complete subject to policy |
| Teaching assignments | `GET/POST /api/teaching-assignments`, `DELETE /api/teaching-assignments/{id}` |
| Course sessions | `GET/POST /api/course-sections/{id}/sessions`, update/delete session |
| Attendance | List and batch-save attendance by `courseSessionId`; history and warnings scoped to authorized course sections |
| Grades | Read and batch-save grade components/results by `courseSectionId`; no client-authoritative total |
| Dashboard | `GET /api/dashboard/summary` with role-scoped university metrics |

## 4. Cross-cutting contract requirements

- Use stable database IDs in API relations; do not identify records by display names.
- Validate that a student is actively enrolled in the course section before accepting attendance or grades.
- Validate that a teacher is assigned to the course section before allowing teacher operations.
- Admin access is institution-wide; teacher access is assignment-scoped.
- Use consistent status enums and error response shapes.
- Use pagination for growing collections rather than loading all records into memory.
- Preserve the existing API client behavior for JSON, credentials, 401 handling, and 204 responses unless a security review requires a change.
- Frontend types must mirror DTOs; avoid silently normalizing missing domain fields into fake values.

## 5. Migration compatibility

The inspected `main` branch contains Flyway migrations V1–V3. V1 defines school-specific `classes`, `students.class_id`, `class_leaders`, and K-12 subject periods. V3 adds `teacher_class_subjects`, school-session attendance, and school assessment grade records.

Do not edit already-applied migrations. The university schema should be introduced with new additive Flyway migrations after the target ERD and data-retention policy are approved. Any old school records must be explicitly retained, archived, transformed, or excluded; never drop them implicitly.

## 6. Frontend modules to refactor

- `modules/student`: replace school filters and parent contact data with university student profile fields.
- `modules/class`: split into `student-class` and `course-section` modules.
- `modules/subject`: remove K-12 periods and evaluation assumptions.
- `modules/teaching`: provide course-section options and assignment scope.
- `modules/grade`: replace fixed five-column school gradebook.
- `modules/attendance`: select course section/session and enrolled students.
- `modules/dashboard`: replace school-specific metrics.
- `components/layout/Sidebar.tsx`: update labels, routes, and teacher-visible navigation.

Shared API client, auth context, layout shell, and generic UI components are retained unless later tests reveal a concrete incompatibility.
