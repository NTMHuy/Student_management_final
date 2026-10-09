import { Teacher, TeacherFiltersState, TeacherFormData } from "../types";
import { initialTeachers } from "../mocks/teacher.mock";

let memoryTeachers = [...initialTeachers];

export const teacherService = {
  async getTeachers(
    filters?: Partial<TeacherFiltersState>,
  ): Promise<Teacher[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...memoryTeachers];

        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter(
            (t) =>
              t.teacherCode.toLowerCase().includes(q) ||
              t.fullName.toLowerCase().includes(q) ||
              t.email.toLowerCase().includes(q) ||
              t.phone.includes(q) ||
              t.titleRole.toLowerCase().includes(q),
          );
        }

        if (filters?.department) {
          result = result.filter((t) =>
            t.department
              .toLowerCase()
              .includes(filters.department!.toLowerCase()),
          );
        }

        if (filters?.status) {
          result = result.filter((t) => t.status === filters.status);
        }

        if (filters?.degree) {
          result = result.filter((t) =>
            t.degree?.toLowerCase().includes(filters.degree!.toLowerCase()),
          );
        }

        resolve(result);
      }, 200);
    });
  },

  async getTeacher(id: string): Promise<Teacher | null> {
    return new Promise((resolve) => {
      const found = memoryTeachers.find((t) => t.id === id);
      resolve(found || null);
    });
  },

  async createTeacher(data: TeacherFormData): Promise<Teacher> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nextCodeNum = 1001 + memoryTeachers.length;
        const initials =
          data.fullName
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .map((n) => n[0].toUpperCase())
            .join("") || "GV";

        const newTeacher: Teacher = {
          id: `t-${Date.now()}`,
          teacherCode: `GV-${nextCodeNum}`,
          fullName: data.fullName,
          titleRole: data.titleRole || "Giáo viên bộ môn",
          department: data.department || "Toán - Tin học",
          subjectTaught: data.subjectTaught || "Toán học",
          email: data.email || "giaovien@edumanage.edu.vn",
          phone: data.phone || "0912 345 678",
          status: "active",
          avatarInitials: initials,
          degree: data.degree || "Cử nhân Sư phạm",
          notes: data.notes || "",
        };

        memoryTeachers = [newTeacher, ...memoryTeachers];
        resolve(newTeacher);
      }, 300);
    });
  },

  async updateTeacher(
    id: string,
    data: Partial<TeacherFormData>,
  ): Promise<Teacher | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = memoryTeachers.findIndex((t) => t.id === id);
        if (index === -1) {
          resolve(null);
          return;
        }

        const existing = memoryTeachers[index];
        const updated: Teacher = {
          ...existing,
          ...data,
        };

        memoryTeachers[index] = updated;
        resolve(updated);
      }, 300);
    });
  },

  async deleteTeacher(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        memoryTeachers = memoryTeachers.filter(
          (t) => t.id !== id && t.teacherCode !== id,
        );
        resolve(true);
      }, 250);
    });
  },
};
