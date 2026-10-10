export type GradeRank = 'Giỏi' | 'Khá' | 'Đạt' | 'Chưa đạt';

export type GradeField = 'tx1' | 'tx2' | 'tx3' | 'gk' | 'ck';

export interface StudentGradeRecord {
  /** id học sinh (dạng chuỗi) - khóa của dòng trong bảng điểm */
  id: string;
  studentId: number;
  studentCode: string;
  fullName: string;
  avatarInitials: string;
  tx1: number | null; // Miệng
  tx2: number | null; // 15 Phút
  tx3: number | null; // 1 Tiết
  gk: number | null;  // Giữa kỳ (x2)
  ck: number | null;  // Cuối kỳ (x3)
  avgScore: number | null;
  rank: GradeRank | null;
}

export interface GradeFiltersState {
  classId: string;
  subjectId: string;
  /** "<năm học>|<học kỳ>", ví dụ "2025-2026|1" */
  semester: string;
  viewType: 'all' | 'tx' | 'exam';
}
