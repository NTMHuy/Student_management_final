import {
  DailyAttendanceItem,
  AttendanceHistoryItem,
  AttendanceEarlyWarning,
  AttendanceStatus,
  AttendanceFiltersState,
  AttendanceHistoryFiltersState,
} from "../types";
import {
  initialDailyAttendance,
  initialAttendanceHistory,
  initialEarlyWarnings,
} from "../mocks/attendance.mock";

let memoryDaily = [...initialDailyAttendance];
let memoryHistory = [...initialAttendanceHistory];
let memoryWarnings = [...initialEarlyWarnings];

export const attendanceService = {
  async getDailyAttendance(
    filters?: Partial<AttendanceFiltersState>,
  ): Promise<DailyAttendanceItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...memoryDaily]), 150);
    });
  },

  async updateDailyStatus(
    studentId: string,
    status: AttendanceStatus,
    note?: string,
  ): Promise<DailyAttendanceItem | null> {
    return new Promise((resolve) => {
      const idx = memoryDaily.findIndex(
        (i) => i.id === studentId || i.studentCode === studentId,
      );
      if (idx !== -1) {
        memoryDaily[idx] = {
          ...memoryDaily[idx],
          status,
          ...(note !== undefined ? { note } : {}),
        };
        resolve(memoryDaily[idx]);
      } else {
        resolve(null);
      }
    });
  },

  async markAllPresent(): Promise<DailyAttendanceItem[]> {
    return new Promise((resolve) => {
      memoryDaily = memoryDaily.map((item) => ({
        ...item,
        status: "present",
      }));
      resolve([...memoryDaily]);
    });
  },

  async saveDailyAttendance(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 300);
    });
  },

  async getAttendanceHistory(
    filters?: Partial<AttendanceHistoryFiltersState>,
  ): Promise<AttendanceHistoryItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...memoryHistory];

        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter(
            (h) =>
              h.fullName.toLowerCase().includes(q) ||
              h.studentCode.toLowerCase().includes(q) ||
              h.teacherName.toLowerCase().includes(q),
          );
        }

        if (filters?.className) {
          result = result.filter((h) => h.className === filters.className);
        }

        if (filters?.status && filters.status !== "all") {
          result = result.filter((h) => h.status === filters.status);
        }

        resolve(result);
      }, 200);
    });
  },

  async getEarlyWarnings(): Promise<AttendanceEarlyWarning[]> {
    return new Promise((resolve) => resolve([...memoryWarnings]));
  },
};
