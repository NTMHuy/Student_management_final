export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface CourseSessionOption {
  id: string;
  courseSectionId: string;
  sectionCode: string;
  subjectCode: string;
  subjectName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  room: string;
  status: string;
}

export interface DailyAttendanceItem {
  id: string;
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  avatarLetter: string;
  status: AttendanceStatus | null;
  note: string;
}

export interface AttendanceHistoryItem {
  id: string;
  dateStr: string;
  timeStr: string;
  sectionCode: string;
  sectionName: string;
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
  studentClassName: string;
  totalMissed: number;
  unexcused: number;
  excused: number;
  avatarInitials: string;
}

export interface AttendanceFiltersState {
  courseSectionId: string;
  courseSessionId: string;
}

export interface AttendanceHistoryFiltersState {
  search: string;
  courseSectionId: string;
  from: string;
  to: string;
  status: string;
}
