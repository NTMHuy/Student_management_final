import { apiRequest } from "@/lib/api/client";
import { GradeFiltersState, StudentGradeRecord, GradeScore } from "../types";
interface GradeApiRow {
 enrollmentId:number; studentId:number; studentCode:string; fullName:string;
 sectionCode:string; subjectName:string; scores:GradeScore[];
 processAverage:number|null; midtermScore:number|null; finalScore:number|null; totalScore:number|null;
}
export const gradeService = {
 async getGradeRecords(filters:GradeFiltersState):Promise<StudentGradeRecord[]> {
  const rows=await apiRequest<GradeApiRow[]>(`/api/grades?courseSectionId=${encodeURIComponent(filters.courseSectionId)}`);
  return rows.map(r=>({id:String(r.enrollmentId),enrollmentId:r.enrollmentId,studentId:r.studentId,
   studentCode:r.studentCode,fullName:r.fullName,scores:r.scores,processAverage:r.processAverage,
   midtermScore:r.midtermScore,finalScore:r.finalScore,totalScore:r.totalScore}));
 },
 async saveAllGrades(filters:GradeFiltersState,records:StudentGradeRecord[]):Promise<void> {
  const entries=records.flatMap(r=>r.scores.map(s=>({enrollmentId:r.enrollmentId,
   componentType:s.componentType,attemptNumber:s.attemptNumber,score:s.score,note:s.note})));
  await apiRequest<void>("/api/grades/batch",{method:"PUT",
   body:{courseSectionId:Number(filters.courseSectionId),entries}});
 }
};
