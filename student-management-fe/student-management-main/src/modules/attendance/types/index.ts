export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';
export type AttendanceSession = 'MORNING' | 'AFTERNOON';

export const SESSION_LABEL: Record<AttendanceSession, string> = {
  MORNING: 'Buổi Sáng',
  AFTERNOON: 'Buổi Chiều',
};

export interface DailyAttendanceItem {
  /** id học sinh (dạng chuỗi) - khóa của dòng */
  id: string;
  studentId: number;
  studentCode: string;
  fullName: string;
  avatarLetter: string;
  /** null = chưa điểm danh */
  status: AttendanceStatus | null;
  note: string;
}

export interface AttendanceHistoryItem {
  id: string;
  dateStr: string; // dd/mm/yyyy
  session: string; // 'Buổi Sáng' | 'Buổi Chiều'
  className: string;
  subjectName: string;
  studentCode: string;
  fullName: string;
  avatarInitials: string;
  status: AttendanceStatus;
  teacherName: string;
  note: string;
}

export interface AttendanceEarlyWarning {
  id: string;
  fullName: string;
  studentCode: string;
  className: string;
  totalMissed: number;
  unexcused: number;
  excused: number;
  avatarInitials: string;
}

export interface AttendanceFiltersState {
  classId: string;
  date: string; // yyyy-mm-dd
  session: AttendanceSession;
  /** Môn học bắt buộc khi điểm danh theo phân công lớp/môn. */
  subjectId: string;
}

export interface AttendanceHistoryFiltersState {
  search: string;
  /** '' = tất cả lớp được xem */
  classId: string;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  status: string; // 'all' | AttendanceStatus
}
