export type GradeComponent = 'PROCESS' | 'MIDTERM' | 'FINAL';
export interface GradeScore { id:number|null; componentType:GradeComponent; attemptNumber:number; score:number|null; note:string|null }
export interface StudentGradeRecord { id:string; enrollmentId:number; studentId:number; studentCode:string; fullName:string; scores:GradeScore[]; processAverage:number|null; midtermScore:number|null; finalScore:number|null; totalScore:number|null }
export interface GradeFiltersState { courseSectionId:string }
