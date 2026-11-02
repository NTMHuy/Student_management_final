export interface TeachingCourseSectionOption {
  id: number;
  sectionCode: string;
  sectionName: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  semesterId: number;
  semesterName: string;
  status: string;
}

export interface TeachingOptions {
  /** true = teacher sees assigned course sections; false = admin sees all. */
  restricted: boolean;
  courseSections: TeachingCourseSectionOption[];
}
