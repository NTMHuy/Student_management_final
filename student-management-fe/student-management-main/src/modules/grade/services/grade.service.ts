import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { classService } from "@/modules/class/services/class.service";
import { subjectService } from "@/modules/subject/services/subject.service";
import { StudentGradeRecord, GradeFiltersState } from "../types";
import { calculateAverage } from "../mocks/grade.mock";

type AssessmentType = "ORAL" | "FIFTEEN_MIN" | "ONE_PERIOD" | "MIDTERM" | "FINAL";
type GradeField = "tx1" | "tx2" | "tx3" | "gk" | "ck";

interface GradeApiRow {
  id: number | null;
  studentId: number;
  studentCode: string;
  fullName: string;
  subjectId: number | null;
  schoolYear: string | null;
  semester: number | null;
  assessmentType: AssessmentType | null;
  assessmentNumber: number | null;
  score: number | null;
  note: string | null;
}

const FIELD_TO_ASSESSMENT: Record<GradeField, AssessmentType> = {
  tx1: "ORAL",
  tx2: "FIFTEEN_MIN",
  tx3: "ONE_PERIOD",
  gk: "MIDTERM",
  ck: "FINAL",
};

const SUBJECT_ALIASES: Record<string, string[]> = {
  math: ["TOAN", "TOÁN", "TOÁN HỌC"],
  phys: ["LY", "VAT LY", "VẬT LÝ"],
  chem: ["HOA", "HOA HOC", "HÓA HỌC"],
  lit: ["VAN", "NGU VAN", "NGỮ VĂN"],
  eng: ["ANH", "TIENG ANH", "TIẾNG ANH"],
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function parseTerm(value: string): { semester: number; schoolYear: string } {
  const match = value.match(/^sem([12])-(\d{4}-\d{4})$/);
  if (!match) throw new Error("Học kỳ hoặc niên khóa không hợp lệ.");
  return { semester: Number(match[1]), schoolYear: match[2] };
}

async function resolveClassId(className: string): Promise<string> {
  const classes = await classService.getClasses();
  const found = classes.find((item) =>
    [item.className, item.classCode].some((name) => normalize(name) === normalize(className)),
  );
  if (!found) throw new Error(`Không tìm thấy lớp ${className} trong dữ liệu hệ thống.`);
  return found.id;
}

async function resolveSubjectId(subjectKey: string): Promise<string> {
  const subjects = await subjectService.getSubjects();
  const aliases = SUBJECT_ALIASES[subjectKey] ?? [normalize(subjectKey)];
  const found = subjects.find((item) =>
    [item.subjectCode, item.name].some((value) =>
      aliases.includes(normalize(value)) || normalize(value) === normalize(subjectKey),
    ),
  );
  if (!found) throw new Error(`Không tìm thấy môn học tương ứng với ${subjectKey}.`);
  return found.id;
}

function toStudentRecords(rows: GradeApiRow[]): StudentGradeRecord[] {
  const grouped = new Map<string, StudentGradeRecord>();
  for (const row of rows) {
    const studentId = String(row.studentId);
    let record = grouped.get(studentId);
    if (!record) {
      record = {
        id: studentId,
        studentCode: row.studentCode,
        fullName: row.fullName,
        avatarInitials: row.fullName.split(/\s+/).slice(-2).map((part) => part[0] ?? "").join("").toUpperCase(),
        tx1: null, tx2: null, tx3: null, gk: null, ck: null,
        avgScore: null, rank: null,
      };
      grouped.set(studentId, record);
    }
    if (!row.assessmentType || row.score === null) continue;
    const field = (Object.keys(FIELD_TO_ASSESSMENT) as GradeField[])
      .find((key) => FIELD_TO_ASSESSMENT[key] === row.assessmentType);
    if (field) record[field] = row.score;
  }
  return [...grouped.values()].map((record) => {
    const { avg, rank } = calculateAverage(record.tx1, record.tx2, record.tx3, record.gk, record.ck);
    return { ...record, avgScore: avg, rank };
  });
}

async function resolveFilters(filters?: Partial<GradeFiltersState>) {
  const classId = await resolveClassId(filters?.className ?? "10A1");
  const subjectId = await resolveSubjectId(filters?.subject ?? "math");
  const { semester, schoolYear } = parseTerm(filters?.semester ?? "sem2-2023-2024");
  return { classId, subjectId, semester, schoolYear };
}

export const gradeService = {
  async getGradeRecords(filters?: Partial<GradeFiltersState>): Promise<StudentGradeRecord[]> {
    const { classId, subjectId, semester, schoolYear } = await resolveFilters(filters);
    const rows = await apiRequest<GradeApiRow[]>(
      `${API_ENDPOINTS.grades}?classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}&schoolYear=${encodeURIComponent(schoolYear)}&semester=${semester}`,
    );
    return toStudentRecords(rows);
  },

  async saveAllGrades(records: StudentGradeRecord[], filters?: Partial<GradeFiltersState>): Promise<boolean> {
    const { classId, subjectId, semester, schoolYear } = await resolveFilters(filters);
    const requests = records.flatMap((record) =>
      (Object.keys(FIELD_TO_ASSESSMENT) as GradeField[]).map((field) => {
        const params = new URLSearchParams({
          studentId: record.id,
          classId,
          subjectId,
          schoolYear,
          semester: String(semester),
          assessmentType: FIELD_TO_ASSESSMENT[field],
          assessmentNumber: "1",
        });
        if (record[field] === null) {
          return apiRequest<void>(`${API_ENDPOINTS.grades}?${params.toString()}`, {
            method: "DELETE",
          });
        }
        return apiRequest<GradeApiRow>(API_ENDPOINTS.grades, {
          method: "PUT",
          body: {
            studentId: Number(record.id),
            classId: Number(classId),
            subjectId: Number(subjectId),
            schoolYear,
            semester,
            assessmentType: FIELD_TO_ASSESSMENT[field],
            assessmentNumber: 1,
            score: record[field],
          },
        });
      }),
    );
    await Promise.all(requests);
    return true;
  },
};
