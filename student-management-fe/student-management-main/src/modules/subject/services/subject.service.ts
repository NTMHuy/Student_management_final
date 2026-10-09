import { Subject, SubjectFiltersState, SubjectFormData } from "../types";
import { initialSubjects } from "../mocks/subject.mock";

let memorySubjects = [...initialSubjects];

export const subjectService = {
  async getSubjects(
    filters?: Partial<SubjectFiltersState>,
  ): Promise<Subject[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...memorySubjects];

        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter(
            (s) =>
              s.subjectCode.toLowerCase().includes(q) ||
              s.name.toLowerCase().includes(q) ||
              s.department.toLowerCase().includes(q) ||
              s.headTeacher.toLowerCase().includes(q),
          );
        }

        if (filters?.department) {
          result = result.filter((s) =>
            s.department
              .toLowerCase()
              .includes(filters.department!.toLowerCase()),
          );
        }

        if (filters?.evaluationType) {
          result = result.filter(
            (s) => s.evaluationType === filters.evaluationType,
          );
        }

        resolve(result);
      }, 200);
    });
  },

  async createSubject(data: SubjectFormData): Promise<Subject> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSubject: Subject = {
          id: `sb-${Date.now()}`,
          subjectCode: data.subjectCode.toUpperCase(),
          name: data.name,
          department: data.department,
          weeklyPeriods: `${data.grade10Periods} / ${data.grade11Periods} / ${data.grade12Periods} tiết`,
          periodsByGrade: {
            grade10: Number(data.grade10Periods),
            grade11: Number(data.grade11Periods),
            grade12: Number(data.grade12Periods),
          },
          coefficient:
            data.evaluationType === "score"
              ? "Hệ số 1 (Chính khóa)"
              : "Đánh giá Đ / CĐ",
          evaluationType: data.evaluationType,
          headTeacher: "Đang cập nhật",
          status: "active",
          description: data.description,
        };

        memorySubjects = [newSubject, ...memorySubjects];
        resolve(newSubject);
      }, 300);
    });
  },

  async updateSubject(
    id: string,
    data: SubjectFormData,
  ): Promise<Subject | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = memorySubjects.findIndex((subject) => subject.id === id);
        if (index === -1) {
          resolve(null);
          return;
        }

        const existing = memorySubjects[index];
        const updated: Subject = {
          ...existing,
          subjectCode: data.subjectCode.toUpperCase(),
          name: data.name,
          department: data.department,
          weeklyPeriods: `${data.grade10Periods} / ${data.grade11Periods} / ${data.grade12Periods} tiết`,
          periodsByGrade: {
            grade10: Number(data.grade10Periods),
            grade11: Number(data.grade11Periods),
            grade12: Number(data.grade12Periods),
          },
          coefficient:
            data.evaluationType === "score"
              ? "Hệ số 1 (Chính khóa)"
              : "Đánh giá Đ / CĐ",
          evaluationType: data.evaluationType,
          description: data.description,
        };

        memorySubjects[index] = updated;
        resolve(updated);
      }, 300);
    });
  },

  async deleteSubject(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      memorySubjects = memorySubjects.filter(
        (s) => s.id !== id && s.subjectCode !== id,
      );
      resolve(true);
    });
  },
};
