export type GradeRank = 'Giỏi' | 'Khá' | 'Đạt' | 'Chưa đạt';
export type GradeViewType = 'all' | 'process' | 'exam';

export interface ProcessScore {
  assessmentNumber: number;
  score: number | null;
  note?: string | null;
}

export interface StudentGradeRecord {
  id: string;
  studentId: number;
  studentCode: string;
  fullName: string;
  avatarInitials: string;
  processScores: ProcessScore[];
  midtermScore: number | null;
  finalScore: number | null;
  processAverage: number | null;
  avgScore: number | null;
  rank: GradeRank | null;
  processWeight: number | null;
  midtermWeight: number | null;
  finalWeight: number | null;
}

export type GradeField = `process:${number}` | 'midterm' | 'final';

export interface GradeFiltersState {
  classId: string;
  subjectId: string;
  semester: string;
  viewType: GradeViewType;
}
