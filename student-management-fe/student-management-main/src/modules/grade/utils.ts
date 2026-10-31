import { GradeField, StudentGradeRecord } from './types';

/** Cột trong giao diện ↔ (loại điểm, lần) ở backend. */
export const GRADE_COLUMNS: {
  field: GradeField;
  type: 'ORAL' | 'FIFTEEN_MIN' | 'ONE_PERIOD' | 'MIDTERM' | 'FINAL';
  label: string;
  group: 'tx' | 'exam';
}[] = [
  { field: 'tx1', type: 'ORAL', label: 'Miệng (TX1)', group: 'tx' },
  { field: 'tx2', type: 'FIFTEEN_MIN', label: '15 Phút (TX2)', group: 'tx' },
  { field: 'tx3', type: 'ONE_PERIOD', label: '1 Tiết (TX3)', group: 'tx' },
  { field: 'gk', type: 'MIDTERM', label: 'Giữa Kỳ (x2)', group: 'exam' },
  { field: 'ck', type: 'FINAL', label: 'Cuối Kỳ (x3)', group: 'exam' },
];

/** ĐTB = (TX1 + TX2 + TX3 + 2·GK + 3·CK) / 8, chỉ tính khi đủ 5 cột điểm. */
export function calculateAverage(
  tx1: number | null,
  tx2: number | null,
  tx3: number | null,
  gk: number | null,
  ck: number | null,
): { avg: number | null; rank: StudentGradeRecord['rank'] } {
  if (tx1 === null || tx2 === null || tx3 === null || gk === null || ck === null) {
    return { avg: null, rank: null };
  }
  const avg = Math.round(((tx1 + tx2 + tx3 + gk * 2 + ck * 3) / 8) * 10) / 10;

  let rank: StudentGradeRecord['rank'] = 'Chưa đạt';
  if (avg >= 8.0) rank = 'Giỏi';
  else if (avg >= 6.5) rank = 'Khá';
  else if (avg >= 5.0) rank = 'Đạt';

  return { avg, rank };
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Niên khóa hiện tại theo lịch: từ tháng 8 là năm học mới. */
export function currentSchoolYearStart(now = new Date()): number {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export function semesterOptions(now = new Date()): { value: string; label: string }[] {
  const start = currentSchoolYearStart(now);
  const result: { value: string; label: string }[] = [];
  for (const y of [start, start - 1]) {
    for (const s of [2, 1]) {
      result.push({
        value: `${y}-${y + 1}|${s}`,
        label: `Học kỳ ${s === 1 ? 'I' : 'II'} (${y} - ${y + 1})`,
      });
    }
  }
  return result;
}

/** Học kỳ mặc định: tháng 1-7 → HK II, còn lại → HK I của niên khóa hiện tại. */
export function defaultSemester(now = new Date()): string {
  const start = currentSchoolYearStart(now);
  const semester = now.getMonth() >= 7 || now.getMonth() === 0 ? 1 : 2;
  return `${start}-${start + 1}|${semester}`;
}

export function parseSemester(value: string): { schoolYear: string; semester: number } {
  const [schoolYear, sem] = value.split('|');
  return { schoolYear, semester: Number(sem) };
}
