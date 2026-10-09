export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
  },
  students: "/students",
  teachers: "/teachers",
  classes: "/classes",
  subjects: "/subjects",
  grades: "/grades",
  attendance: "/attendance",
} as const;
