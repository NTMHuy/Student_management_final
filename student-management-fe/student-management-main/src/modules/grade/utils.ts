import { StudentGradeRecord } from './types';

export function calculateWeightedAverage(
  processAverage: number | null,
  midterm: number | null,
  finalScore: number | null,
  processWeight: number,
  midtermWeight: number,
  finalWeight: number,
): number | null {
  if (processAverage === null || midterm === null || finalScore === null) return null;
  return Math.round((processAverage * processWeight + midterm * midtermWeight + finalScore * finalWeight) / 100 * 100) / 100;
}

export function rankOf(score: number | null): StudentGradeRecord['rank'] {
  if (score === null) return null;
  if (score >= 8) return 'Giỏi';
  if (score >= 6.5) return 'Khá';
  if (score >= 5) return 'Đạt';
  return 'Chưa đạt';
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function currentSchoolYearStart(now = new Date()): number {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export function semesterOptions(now = new Date()): { value: string; label: string }[] {
  const start = currentSchoolYearStart(now);
  const result: { value: string; label: string }[] = [];
  for (const y of [start, start - 1]) for (const s of [2, 1]) {
    result.push({ value: `${y}-${y + 1}|${s}`, label: `Học kỳ ${s === 1 ? 'I' : 'II'} (${y} - ${y + 1})` });
  }
  return result;
}

export function defaultSemester(now = new Date()): string {
  const start = currentSchoolYearStart(now);
  const semester = now.getMonth() >= 7 || now.getMonth() === 0 ? 1 : 2;
  return `${start}-${start + 1}|${semester}`;
}

export function parseSemester(value: string): { schoolYear: string; semester: number } {
  const [schoolYear, sem] = value.split('|');
  return { schoolYear, semester: Number(sem) };
}
