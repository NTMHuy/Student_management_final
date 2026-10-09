import { Student, StudentFiltersState, StudentFormData } from "../types";
import { initialStudents } from "../mocks/student.mock";

let memoryStudents = [...initialStudents];

export const studentService = {
  async getStudents(
    filters?: Partial<StudentFiltersState>,
  ): Promise<Student[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...memoryStudents];

        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter(
            (s) =>
              s.studentCode.toLowerCase().includes(q) ||
              s.fullName.toLowerCase().includes(q) ||
              s.parentEmail.toLowerCase().includes(q) ||
              s.phone.includes(q),
          );
        }

        if (filters?.gradeLevel) {
          result = result.filter(
            (s) => s.gradeLevel.toString() === filters.gradeLevel,
          );
        }

        if (filters?.className) {
          result = result.filter((s) => s.className === filters.className);
        }

        if (filters?.status) {
          result = result.filter((s) => s.status === filters.status);
        }

        resolve(result);
      }, 200);
    });
  },

  async getStudent(id: string): Promise<Student | null> {
    return new Promise((resolve) => {
      const found = memoryStudents.find((s) => s.id === id);
      resolve(found || null);
    });
  },

  async createStudent(data: StudentFormData): Promise<Student> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nextCodeNum = 124 + memoryStudents.length;
        const initials =
          data.fullName
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .map((n) => n[0].toUpperCase())
            .join("") || "HS";

        const newStudent: Student = {
          id: `s-${Date.now()}`,
          studentCode: `HS00${nextCodeNum}`,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          gradeLevel: Number(data.gradeLevel),
          className: data.className || `${data.gradeLevel}A1`,
          parentEmail: data.parentEmail || "phuhuynh@example.com",
          phone: data.phone || "0912 345 678",
          notes: data.notes || "",
          status: "active",
          avatarInitials: initials,
        };

        memoryStudents = [newStudent, ...memoryStudents];
        resolve(newStudent);
      }, 300);
    });
  },

  async updateStudent(
    id: string,
    data: Partial<StudentFormData>,
  ): Promise<Student | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = memoryStudents.findIndex((s) => s.id === id);
        if (index === -1) {
          resolve(null);
          return;
        }

        const existing = memoryStudents[index];
        const updated: Student = {
          ...existing,
          ...data,
          gradeLevel: data.gradeLevel
            ? Number(data.gradeLevel)
            : existing.gradeLevel,
        };

        memoryStudents[index] = updated;
        resolve(updated);
      }, 300);
    });
  },

  async deleteStudent(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        memoryStudents = memoryStudents.filter(
          (s) => s.id !== id && s.studentCode !== id,
        );
        resolve(true);
      }, 250);
    });
  },
};
