import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { classService } from "@/modules/class/services/class.service";
import {
  DailyAttendanceItem,
  AttendanceHistoryItem,
  AttendanceEarlyWarning,
  AttendanceStatus,
  AttendanceFiltersState,
  AttendanceHistoryFiltersState,
} from "../types";

interface AttendanceApiRow {
  id: number | null;
  studentId: number;
  studentCode: string;
  fullName: string;
  status: "PRESENT" | "EXCUSED" | "UNEXCUSED" | "LATE" | null;
  note: string | null;
}

interface AttendanceContext {
  classId: number;
  date: string;
  session: "MORNING" | "AFTERNOON";
}

const TO_API_STATUS: Record<AttendanceStatus, "PRESENT" | "EXCUSED" | "UNEXCUSED" | "LATE"> = {
  present: "PRESENT",
  excused: "EXCUSED",
  unexcused: "UNEXCUSED",
  late: "LATE",
};

const FROM_API_STATUS: Record<NonNullable<AttendanceApiRow["status"]>, AttendanceStatus> = {
  PRESENT: "present",
  EXCUSED: "excused",
  UNEXCUSED: "unexcused",
  LATE: "late",
};

let currentContext: AttendanceContext | null = null;
let currentItems: DailyAttendanceItem[] = [];

async function resolveClassId(className: string): Promise<number> {
  const classes = await classService.getClasses();
  const normalized = className.replace(/^lớp\s*/i, "").trim().toLowerCase();
  const found = classes.find((item) =>
    [item.className, item.classCode].some((name) =>
      name.replace(/^lớp\s*/i, "").trim().toLowerCase() === normalized,
    ),
  );
  if (!found) throw new Error(`Không tìm thấy lớp ${className} trong dữ liệu hệ thống.`);
  return Number(found.id);
}

function mapRow(row: AttendanceApiRow): DailyAttendanceItem {
  const status = row.status ? FROM_API_STATUS[row.status] : "present";
  const initials = row.fullName.trim().split(/\s+/).slice(-1)[0]?.[0] ?? "";
  return {
    // For a not-yet-saved attendance row, use studentId as the stable UI key.
    id: String(row.studentId),
    studentCode: row.studentCode,
    fullName: row.fullName,
    avatarLetter: initials.toUpperCase(),
    status,
    checkInTime: status === "unexcused" || status === "excused" ? "Chưa vào" : "--:--",
    note: row.note ?? "",
  };
}

async function persistStatus(
  studentId: string,
  status: AttendanceStatus,
  note?: string,
): Promise<void> {
  if (!currentContext) throw new Error("Chưa tải danh sách lớp để điểm danh.");
  await apiRequest<AttendanceApiRow>(API_ENDPOINTS.attendance, {
    method: "PUT",
    body: {
      studentId: Number(studentId),
      classId: currentContext.classId,
      date: currentContext.date,
      session: currentContext.session,
      status: TO_API_STATUS[status],
      note: note ?? currentItems.find((item) => item.id === studentId)?.note ?? "",
    },
  });
}

export const attendanceService = {
  async getDailyAttendance(
    filters?: Partial<AttendanceFiltersState>,
  ): Promise<DailyAttendanceItem[]> {
    const classId = await resolveClassId(filters?.className ?? "10a1");
    const date = filters?.date ?? new Date().toISOString().slice(0, 10);
    currentContext = { classId, date, session: "MORNING" };
    const rows = await apiRequest<AttendanceApiRow[]>(
      `${API_ENDPOINTS.attendance}?classId=${classId}&date=${encodeURIComponent(date)}&session=MORNING`,
    );
    currentItems = rows.map(mapRow);
    return [...currentItems];
  },

  async updateDailyStatus(
    studentId: string,
    status: AttendanceStatus,
    note?: string,
  ): Promise<DailyAttendanceItem | null> {
    await persistStatus(studentId, status, note);
    const index = currentItems.findIndex((item) => item.id === studentId);
    if (index < 0) return null;
    currentItems[index] = {
      ...currentItems[index],
      status,
      ...(note !== undefined ? { note } : {}),
      checkInTime: status === "excused" || status === "unexcused" ? "Chưa vào" : "--:--",
    };
    return currentItems[index];
  },

  async markAllPresent(): Promise<DailyAttendanceItem[]> {
    for (const item of currentItems) {
      await persistStatus(item.id, "present", item.note);
    }
    currentItems = currentItems.map((item) => ({ ...item, status: "present", checkInTime: "--:--" }));
    return [...currentItems];
  },

  async saveDailyAttendance(): Promise<boolean> {
    // Changes are persisted as soon as a status/note is updated through the API.
    return true;
  },

  async getAttendanceHistory(
    _filters?: Partial<AttendanceHistoryFiltersState>,
  ): Promise<AttendanceHistoryItem[]> {
    // The backend does not yet expose a history/report endpoint.
    return [];
  },

  async getEarlyWarnings(): Promise<AttendanceEarlyWarning[]> {
    // The backend does not yet calculate absence warning aggregates.
    return [];
  },
};
