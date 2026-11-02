import React from "react";
import { GradeFiltersState } from "../types";
import { TeachingCourseSectionOption } from "@/modules/teaching/types";
interface Props { filters:GradeFiltersState; sections:TeachingCourseSectionOption[]; onChange:(v:Partial<GradeFiltersState>)=>void }
export const GradeFilters:React.FC<Props>=({filters,sections,onChange})=><div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
 <label htmlFor="grade-section" className="block text-xs font-semibold mb-2">Lớp học phần</label>
 <select id="grade-section" value={filters.courseSectionId} onChange={e=>onChange({courseSectionId:e.target.value})} className="w-full max-w-xl h-11 px-3 rounded-xl bg-surface-container-low text-sm">
  <option value="">Chọn lớp học phần</option>{sections.map(s=><option key={s.id} value={s.id}>{s.sectionCode} · {s.subjectName} · {s.semesterName}</option>)}
 </select></div>;
