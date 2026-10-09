import { SchoolClass, ClassFiltersState, ClassLeader } from "../types";
import { initialClasses } from "../mocks/class.mock";

let memoryClasses = [...initialClasses];

export const classService = {
  async getClasses(
    filters?: Partial<ClassFiltersState>,
  ): Promise<SchoolClass[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...memoryClasses];

        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter(
            (c) =>
              c.classCode.toLowerCase().includes(q) ||
              c.className.toLowerCase().includes(q) ||
              c.homeroomTeacher.fullName.toLowerCase().includes(q) ||
              c.room.toLowerCase().includes(q) ||
              c.stream.toLowerCase().includes(q),
          );
        }

        if (filters?.gradeLevel) {
          result = result.filter(
            (c) => c.gradeLevel.toString() === filters.gradeLevel,
          );
        }

        if (filters?.stream) {
          result = result.filter((c) =>
            c.stream.toLowerCase().includes(filters.stream!.toLowerCase()),
          );
        }

        if (filters?.capacity === "full") {
          result = result.filter((c) => c.currentStudents >= c.maxStudents);
        } else if (filters?.capacity === "not_full") {
          result = result.filter((c) => c.currentStudents < c.maxStudents);
        }

        resolve(result);
      }, 200);
    });
  },

  async getClass(id: string): Promise<SchoolClass | null> {
    return new Promise((resolve) => {
      const found = memoryClasses.find(
        (c) => c.id === id || c.classCode === id,
      );
      resolve(found || null);
    });
  },

  async assignTeacher(
    classId: string,
    teacher: SchoolClass["homeroomTeacher"],
  ): Promise<SchoolClass | null> {
    return new Promise((resolve) => {
      const idx = memoryClasses.findIndex(
        (c) => c.id === classId || c.classCode === classId,
      );
      if (idx !== -1) {
        memoryClasses[idx] = {
          ...memoryClasses[idx],
          homeroomTeacher: teacher,
        };
        resolve(memoryClasses[idx]);
      } else {
        resolve(null);
      }
    });
  },

  async addStudent(
    classId: string,
    student: { fullName: string; studentCode: string; dateOfBirth: string },
  ): Promise<SchoolClass | null> {
    return new Promise((resolve) => {
      const idx = memoryClasses.findIndex(
        (c) => c.id === classId || c.classCode === classId,
      );
      if (idx !== -1) {
        const target = memoryClasses[idx];
        const updatedStudents = [
          ...target.students,
          {
            id: `cs-${Date.now()}`,
            ...student,
          },
        ];
        memoryClasses[idx] = {
          ...target,
          students: updatedStudents,
          currentStudents: Math.min(
            target.maxStudents,
            target.currentStudents + 1,
          ),
        };
        resolve(memoryClasses[idx]);
      } else {
        resolve(null);
      }
    });
  },

  async removeStudent(
    classId: string,
    studentId: string,
  ): Promise<SchoolClass | null> {
    return new Promise((resolve) => {
      const idx = memoryClasses.findIndex(
        (c) => c.id === classId || c.classCode === classId,
      );
      if (idx !== -1) {
        const target = memoryClasses[idx];
        const updatedStudents = target.students.filter(
          (s) => s.id !== studentId && s.studentCode !== studentId,
        );
        memoryClasses[idx] = {
          ...target,
          students: updatedStudents,
          currentStudents: Math.max(0, target.currentStudents - 1),
        };
        resolve(memoryClasses[idx]);
      } else {
        resolve(null);
      }
    });
  },

  async updateLeaders(
    classId: string,
    leaders: ClassLeader[],
  ): Promise<SchoolClass | null> {
    return new Promise((resolve) => {
      const idx = memoryClasses.findIndex(
        (c) => c.id === classId || c.classCode === classId,
      );
      if (idx !== -1) {
        memoryClasses[idx] = {
          ...memoryClasses[idx],
          leaders,
        };
        resolve(memoryClasses[idx]);
      } else {
        resolve(null);
      }
    });
  },
};
