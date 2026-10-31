import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { GradeFiltersState, StudentGradeRecord } from "../types";
import { initialsOf, parseSemester, rankOf } from "../utils";

interface GradeApiRow {
  id: number | null;
  studentId: number;
  studentCode: string;
  fullName: string;
  assessmentType: 'PROCESS' | 'MIDTERM' | 'FINAL' | null;
  assessmentNumber: number | null;
  score: number | null;
  note?: string | null;
}
interface GradeResultApi {
  studentId: number;
  processAverage: number;
  midtermScore: number;
  finalScore: number;
  processWeight: number;
  midtermWeight: number;
  finalWeight: number;
  totalScore: number;
}

function query(filters: GradeFiltersState) {
  const { schoolYear, semester } = parseSemester(filters.semester);
  return new URLSearchParams({
    classId: filters.classId,
    subjectId: filters.subjectId,
    schoolYear,
    semester: String(semester),
  });
}

export const gradeService = {
  async getGradeRecords(filters: GradeFiltersState): Promise<StudentGradeRecord[]> {
    const params = query(filters);
    const [rows, results] = await Promise.all([
      apiRequest<GradeApiRow[]>(`${API_ENDPOINTS.grades}?${params}`),
      apiRequest<GradeResultApi[]>(`${API_ENDPOINTS.grades}/results?${params}`),
    ]);
    const byStudent = new Map<number, StudentGradeRecord>();
    for (const row of rows) {
      let rec = byStudent.get(row.studentId);
      if (!rec) {
        rec = {
          id: String(row.studentId), studentId: row.studentId,
          studentCode: row.studentCode, fullName: row.fullName,
          avatarInitials: initialsOf(row.fullName), processScores: [],
          midtermScore: null, finalScore: null, processAverage: null,
          avgScore: null, rank: null, processWeight: null,
          midtermWeight: null, finalWeight: null,
        };
        byStudent.set(row.studentId, rec);
      }
      if (row.score === null || row.assessmentType === null || row.assessmentNumber === null) continue;
      if (row.assessmentType === 'PROCESS') {
        rec.processScores.push({ assessmentNumber: row.assessmentNumber, score: Number(row.score), note: row.note });
      } else if (row.assessmentType === 'MIDTERM' && row.assessmentNumber === 1) rec.midtermScore = Number(row.score);
      else if (row.assessmentType === 'FINAL' && row.assessmentNumber === 1) rec.finalScore = Number(row.score);
    }
    const resultMap = new Map(results.map((r) => [r.studentId, r]));
    return [...byStudent.values()].map((rec) => {
      rec.processScores.sort((a,b) => a.assessmentNumber-b.assessmentNumber);
      const result = resultMap.get(rec.studentId);
      if (result) {
        rec.processAverage = Number(result.processAverage);
        rec.avgScore = Number(result.totalScore);
        rec.rank = rankOf(rec.avgScore);
        rec.processWeight = Number(result.processWeight);
        rec.midtermWeight = Number(result.midtermWeight);
        rec.finalWeight = Number(result.finalWeight);
      } else if (rec.processScores.length) {
        rec.processAverage = Math.round(
          rec.processScores.reduce((sum, item) => sum + (item.score ?? 0), 0) /
          rec.processScores.filter((item) => item.score !== null).length * 100
        ) / 100;
      }
      return rec;
    });
  },

  async saveAllGrades(filters: GradeFiltersState, records: StudentGradeRecord[]): Promise<void> {
    const { schoolYear, semester } = parseSemester(filters.semester);
    await apiRequest<void>(`${API_ENDPOINTS.grades}/batch`, {
      method: "PUT",
      body: {
        classId: Number(filters.classId), subjectId: Number(filters.subjectId),
        schoolYear, semester,
        entries: records.flatMap((rec) => [
          ...rec.processScores.map((item) => ({
            studentId: rec.studentId, assessmentType: 'PROCESS',
            assessmentNumber: item.assessmentNumber, score: item.score,
          })),
          { studentId: rec.studentId, assessmentType: 'MIDTERM', assessmentNumber: 1, score: rec.midtermScore },
          { studentId: rec.studentId, assessmentType: 'FINAL', assessmentNumber: 1, score: rec.finalScore },
        ]),
      },
    });
  },
};
