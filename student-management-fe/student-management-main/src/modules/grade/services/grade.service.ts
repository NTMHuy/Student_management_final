import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { GradeField, GradeFiltersState, StudentGradeRecord } from "../types";
import { GRADE_COLUMNS, calculateAverage, initialsOf, parseSemester } from "../utils";

interface GradeApiRow {
  id: number | null;
  studentId: number;
  studentCode: string;
  fullName: string;
  assessmentType: string | null;
  assessmentNumber: number | null;
  score: number | null;
}

function termQuery(filters: GradeFiltersState) {
  const { schoolYear, semester } = parseSemester(filters.semester);
  return { schoolYear, semester };
}

export const gradeService = {
  /** Gộp các dòng điểm của API thành 1 dòng / học sinh (lần kiểm tra số 1 của mỗi loại). */
  async getGradeRecords(filters: GradeFiltersState): Promise<StudentGradeRecord[]> {
    const { schoolYear, semester } = termQuery(filters);
    const params = new URLSearchParams({
      classId: filters.classId,
      subjectId: filters.subjectId,
      schoolYear,
      semester: String(semester),
    });
    const rows = await apiRequest<GradeApiRow[]>(`${API_ENDPOINTS.grades}?${params}`);

    const byStudent = new Map<number, StudentGradeRecord>();
    for (const row of rows) {
      let rec = byStudent.get(row.studentId);
      if (!rec) {
        rec = {
          id: String(row.studentId),
          studentId: row.studentId,
          studentCode: row.studentCode,
          fullName: row.fullName,
          avatarInitials: initialsOf(row.fullName),
          tx1: null,
          tx2: null,
          tx3: null,
          gk: null,
          ck: null,
          avgScore: null,
          rank: null,
        };
        byStudent.set(row.studentId, rec);
      }
      const column = GRADE_COLUMNS.find((c) => c.type === row.assessmentType);
      if (column && row.assessmentNumber === 1 && row.score !== null) {
        rec[column.field as GradeField] = Number(row.score);
      }
    }

    return [...byStudent.values()].map((rec) => {
      const { avg, rank } = calculateAverage(rec.tx1, rec.tx2, rec.tx3, rec.gk, rec.ck);
      return { ...rec, avgScore: avg, rank };
    });
  },

  /** Lưu cả bảng điểm một lần (ô trống = xóa điểm ở ô đó). */
  async saveAllGrades(filters: GradeFiltersState, records: StudentGradeRecord[]): Promise<void> {
    const { schoolYear, semester } = termQuery(filters);
    await apiRequest<void>(`${API_ENDPOINTS.grades}/batch`, {
      method: "PUT",
      body: {
        classId: Number(filters.classId),
        subjectId: Number(filters.subjectId),
        schoolYear,
        semester,
        entries: records.flatMap((rec) =>
          GRADE_COLUMNS.map((col) => ({
            studentId: rec.studentId,
            assessmentType: col.type,
            assessmentNumber: 1,
            score: rec[col.field],
          })),
        ),
      },
    });
  },
};
