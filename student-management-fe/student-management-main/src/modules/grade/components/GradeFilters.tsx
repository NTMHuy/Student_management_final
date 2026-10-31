import React from 'react';
import { GradeFiltersState } from '../types';
import { semesterOptions } from '../utils';
import { TeachingClassOption, TeachingSubjectOption } from '@/modules/teaching/types';
import { ChevronDown } from 'lucide-react';

interface GradeFiltersProps {
  filters: GradeFiltersState;
  classes: TeachingClassOption[];
  subjects: TeachingSubjectOption[];
  onChange: (filters: Partial<GradeFiltersState>) => void;
}

const selectClass =
  'w-full h-11 px-3.5 pr-8 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary';

export const GradeFilters: React.FC<GradeFiltersProps> = ({ filters, classes, subjects, onChange }) => {
  const semesters = semesterOptions();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="grade-class" className="text-xs font-semibold text-on-surface">Lớp học</label>
        <div className="relative">
          <select
            id="grade-class"
            value={filters.classId}
            onChange={(e) => onChange({ classId: e.target.value })}
            className={selectClass}
          >
            {classes.length === 0 && <option value="">Chưa có lớp nào</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Lớp {c.name} (Khối {c.gradeLevel})</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="grade-subject" className="text-xs font-semibold text-on-surface">Môn học</label>
        <div className="relative">
          <select
            id="grade-subject"
            value={filters.subjectId}
            onChange={(e) => onChange({ subjectId: e.target.value })}
            className={selectClass}
          >
            {subjects.length === 0 && <option value="">Chưa có môn nào</option>}
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="grade-semester" className="text-xs font-semibold text-on-surface">Học kỳ &amp; Niên khóa</label>
        <div className="relative">
          <select
            id="grade-semester"
            value={filters.semester}
            onChange={(e) => onChange({ semester: e.target.value })}
            className={selectClass}
          >
            {semesters.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="grade-view" className="text-xs font-semibold text-on-surface">Loại điểm hiển thị</label>
        <div className="relative">
          <select
            id="grade-view"
            value={filters.viewType}
            onChange={(e) => onChange({ viewType: e.target.value as GradeFiltersState['viewType'] })}
            className={selectClass}
          >
            <option value="all">Tất cả cột điểm (TX, GK, CK)</option>
            <option value="tx">Chỉ Điểm thường xuyên (TX1, TX2, TX3)</option>
            <option value="exam">Chỉ Điểm thi Giữa kỳ &amp; Cuối kỳ</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>
    </div>
  );
};
