export type GradeRank = 'Giỏi' | 'Khá' | 'Đạt' | 'Chưa đạt';

export interface StudentGradeRecord {
  id: string;
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
  className: string;
  subject: string;
  semester: string;
  viewType: 'all' | 'tx' | 'exam';
}
