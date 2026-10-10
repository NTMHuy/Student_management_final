import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  AttendanceEarlyWarning,
  AttendanceFiltersState,
  AttendanceHistoryFiltersState,
  AttendanceHistoryItem,
  AttendanceSession,
  AttendanceStatus,
  DailyAttendanceItem,
  SESSION_LABEL,
} from "../types";
import { formatDate, initialsOf } from "../utils";

interface AttendanceRowApi {
  id: number | null;
  studentId: number;
  studentCode: string;
  fullName: string;
  status: string | null;
  note: string | null;
}

interface HistoryRowApi {
  id: number;
  date: string;
  session: AttendanceSession;
  className: string;
  subjectName: string | null;
  studentCode: string;
  fullName: string;
  status: string;
  note: string | null;
  teacherName: string;
}

interface WarningRowApi {
  studentId: number;
  studentCode: string;
  fullName: string;
  className: string;
  totalMissed: number;
  unexcused: number;
  excused: number;
}

const toStatus = (value: string | null): AttendanceStatus | null =>
  value ? (value.toLowerCase() as AttendanceStatus) : null;

const toDailyItem = (row: AttendanceRowApi): DailyAttendanceItem => ({
  id: String(row.studentId),
  studentId: row.studentId,
  studentCode: row.studentCode,
  fullName: row.fullName,
  avatarLetter: initialsOf(row.fullName),
  status: toStatus(row.status),
  note: row.note ?? "",
});

export const attendanceService = {
  async getDailyAttendance(filters: AttendanceFiltersState): Promise<DailyAttendanceItem[]> {
    const params = new URLSearchParams({
      classId: filters.classId,
      date: filters.date,
      session: filters.session,
    });
    if (filters.subjectId) params.set("subjectId", filters.subjectId);
    const rows = await apiRequest<AttendanceRowApi[]>(`${API_ENDPOINTS.attendance}?${params}`);
    return rows.map(toDailyItem);
  },

  /** Lưu điểm danh cả lớp một lần; chỉ gửi những học sinh đã được chọn trạng thái. */
  async saveDailyAttendance(
    filters: AttendanceFiltersState,
    items: DailyAttendanceItem[],
  ): Promise<DailyAttendanceItem[]> {
    const rows = await apiRequest<AttendanceRowApi[]>(`${API_ENDPOINTS.attendance}/batch`, {
      method: "PUT",
      body: {
        classId: Number(filters.classId),
        subjectId: filters.subjectId ? Number(filters.subjectId) : null,
        date: filters.date,
        session: filters.session,
        entries: items
          .filter((i) => i.status !== null)
          .map((i) => ({
            studentId: i.studentId,
            status: (i.status as AttendanceStatus).toUpperCase(),
            note: i.note.trim() || null,
          })),
      },
    });
    return rows.map(toDailyItem);
  },

  async getAttendanceHistory(filters: AttendanceHistoryFiltersState): Promise<AttendanceHistoryItem[]> {
    const params = new URLSearchParams();
    if (filters.classId) params.set("classId", filters.classId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.search.trim()) params.set("search", filters.search.trim());
    const query = params.toString();
    const rows = await apiRequest<HistoryRowApi[]>(
      `${API_ENDPOINTS.attendance}/history${query ? `?${query}` : ""}`,
    );
    return rows.map((r) => ({
      id: String(r.id),
      dateStr: formatDate(r.date),
      session: SESSION_LABEL[r.session] ?? r.session,
      className: r.className,
      subjectName: r.subjectName ?? "",
      studentCode: r.studentCode,
      fullName: r.fullName,
      avatarInitials: initialsOf(r.fullName),
      status: r.status.toLowerCase() as AttendanceStatus,
      teacherName: r.teacherName,
      note: r.note ?? "",
    }));
  },

  /** Học sinh vắng từ 3 buổi trở lên trong 30 ngày gần nhất (trong các lớp được xem). */
  async getEarlyWarnings(): Promise<AttendanceEarlyWarning[]> {
    const rows = await apiRequest<WarningRowApi[]>(`${API_ENDPOINTS.attendance}/warnings`);
    return rows.map((r) => ({
      id: String(r.studentId),
      fullName: r.fullName,
      studentCode: r.studentCode,
      className: r.className,
      totalMissed: r.totalMissed,
      unexcused: r.unexcused,
      excused: r.excused,
      avatarInitials: initialsOf(r.fullName),
    }));
  },
};
