export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface DailyAttendanceItem {
  id: string;
  studentCode: string;
  fullName: string;
  avatarLetter: string;
  roleSubtitle?: string;
  status: AttendanceStatus;
  checkInTime: string;
  note: string;
  hasAttachment?: boolean;
}

export interface AttendanceHistoryItem {
  id: string;
  dateStr: string;
  session: string; // 'Buổi Sáng' | 'Buổi Chiều'
  className: string;
  periodSubject: string; // 'Tiết 2 · Toán học'
  studentCode: string;
  fullName: string;
  avatarInitials: string;
  status: AttendanceStatus;
  checkInTime: string;
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
  className: string;
  date: string;
  subjectSlot: string;
}

export interface AttendanceHistoryFiltersState {
  search: string;
  className: string;
  dateRange: string;
  status: string;
}
