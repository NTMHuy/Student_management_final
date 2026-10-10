export interface TeachingClassOption {
  id: number;
  name: string;
  gradeLevel: number;
}

export interface TeachingSubjectOption {
  id: number;
  code: string;
  name: string;
}

export interface TeachingPair {
  classId: number;
  subjectId: number;
}

/** Lớp/môn mà tài khoản hiện tại được phép điểm danh / nhập điểm (lấy từ server). */
export interface TeachingOptions {
  /** true = giáo viên (chỉ được lớp/môn đã phân công); false = admin (tất cả). */
  restricted: boolean;
  classes: TeachingClassOption[];
  subjects: TeachingSubjectOption[];
  pairs: TeachingPair[];
}
