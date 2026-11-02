import { apiRequest } from "@/lib/api/client";
import {
  AttendanceEarlyWarning, AttendanceHistoryFiltersState, AttendanceHistoryItem,
  AttendanceStatus, CourseSessionOption, DailyAttendanceItem,
} from "../types";
import { formatDate, initialsOf } from "../utils";

interface AttendanceRowApi {
  id: number | null;
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  status: string | null;
  note: string | null;
}
interface HistoryRowApi {
  id: number; sessionDate: string; startTime: string; endTime: string;
  courseSessionId: number; courseSectionId: number; sectionCode: string; sectionName: string;
  subjectCode: string; subjectName: string; enrollmentId: number; studentId: number;
  studentCode: string; fullName: string; status: string; note: string | null; teacherName: string | null;
}
interface WarningRowApi {
  studentId: number; studentCode: string; fullName: string; studentClassName: string | null;
  totalMissed: number; unexcused: number; excused: number;
}
const toStatus = (value: string | null): AttendanceStatus | null =>
  value ? value.toLowerCase() as AttendanceStatus : null;
const toDailyItem = (row: AttendanceRowApi): DailyAttendanceItem => ({
  id: String(row.enrollmentId), enrollmentId: row.enrollmentId, studentId: row.studentId,
  studentCode: row.studentCode, fullName: row.fullName, avatarLetter: initialsOf(row.fullName),
  status: toStatus(row.status), note: row.note ?? "",
});

export const attendanceService = {
  getCourseSessions(courseSectionId: string): Promise<CourseSessionOption[]> {
    return apiRequest<CourseSessionOption[]>(`/api/course-sessions?courseSectionId=${courseSectionId}`);
  },
  async getDailyAttendance(courseSessionId: string): Promise<DailyAttendanceItem[]> {
    const rows = await apiRequest<AttendanceRowApi[]>(`/api/attendance?courseSessionId=${courseSessionId}`);
    return rows.map(toDailyItem);
  },
  async saveDailyAttendance(courseSessionId: string, items: DailyAttendanceItem[]): Promise<DailyAttendanceItem[]> {
    const rows = await apiRequest<AttendanceRowApi[]>("/api/attendance/batch", {
      method: "PUT",
      body: {
        courseSessionId: Number(courseSessionId),
        entries: items.filter(i => i.status !== null).map(i => ({
          enrollmentId: i.enrollmentId, status: (i.status as AttendanceStatus).toUpperCase(),
          note: i.note.trim() || null,
        })),
      },
    });
    return rows.map(toDailyItem);
  },
  async getAttendanceHistory(filters: AttendanceHistoryFiltersState): Promise<AttendanceHistoryItem[]> {
    const params = new URLSearchParams();
    if (filters.courseSectionId) params.set("courseSectionId", filters.courseSectionId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.search.trim()) params.set("search", filters.search.trim());
    const query = params.toString();
    const rows = await apiRequest<HistoryRowApi[]>(`/api/attendance/history${query ? `?${query}` : ""}`);
    return rows.map(r => ({
      id: String(r.id), dateStr: formatDate(r.sessionDate),
      timeStr: `${r.startTime}–${r.endTime}`, sectionCode: r.sectionCode,
      sectionName: r.sectionName, subjectName: r.subjectName, studentCode: r.studentCode,
      fullName: r.fullName, avatarInitials: initialsOf(r.fullName),
      status: r.status.toLowerCase() as AttendanceStatus, teacherName: r.teacherName ?? "—", note: r.note ?? "",
    }));
  },
  async getEarlyWarnings(): Promise<AttendanceEarlyWarning[]> {
    const rows = await apiRequest<WarningRowApi[]>("/api/attendance/warnings");
    return rows.map(r => ({
      id: String(r.studentId), fullName: r.fullName, studentCode: r.studentCode,
      studentClassName: r.studentClassName ?? "Chưa xếp lớp",
      totalMissed: r.totalMissed, unexcused: r.unexcused, excused: r.excused,
      avatarInitials: initialsOf(r.fullName),
    }));
  },
};
