export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  students: "/api/students",
  teachers: "/api/teachers",
  classes: "/api/classes",
  subjects: "/api/subjects",
  grades: "/api/grades",
  attendance: "/api/attendance",
  dashboard: "/api/dashboard/summary",
} as const;
