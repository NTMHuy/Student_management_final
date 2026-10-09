import React from 'react';
import { GradeFiltersState } from '../types';
import { ChevronDown } from 'lucide-react';

interface GradeFiltersProps {
  filters: GradeFiltersState;
  onChange: (filters: Partial<GradeFiltersState>) => void;
}

export const GradeFilters: React.FC<GradeFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20">
      {/* Class */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface">Lớp học</label>
        <div className="relative">
          <select
            value={filters.className}
            onChange={(e) => onChange({ className: e.target.value })}
            className="w-full h-11 px-3.5 pr-8 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
          >
            <option value="10A1">Lớp 10A1 (Sĩ số: 38)</option>
            <option value="10A2">Lớp 10A2 (Sĩ số: 40)</option>
            <option value="11B1">Lớp 11B1 (Sĩ số: 36)</option>
            <option value="12C3">Lớp 12C3 (Sĩ số: 35)</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface">Môn học</label>
        <div className="relative">
          <select
            value={filters.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            className="w-full h-11 px-3.5 pr-8 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
          >
            <option value="math">Toán học (Hệ số THPT)</option>
            <option value="phys">Vật lý</option>
            <option value="chem">Hóa học</option>
            <option value="lit">Ngữ văn</option>
            <option value="eng">Tiếng Anh</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>

      {/* Semester */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface">Học kỳ &amp; Niên khóa</label>
        <div className="relative">
          <select
            value={filters.semester}
            onChange={(e) => onChange({ semester: e.target.value })}
            className="w-full h-11 px-3.5 pr-8 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
          >
            <option value="sem2-2023-2024">Học kỳ II (2023 - 2024)</option>
            <option value="sem1-2023-2024">Học kỳ I (2023 - 2024)</option>
            <option value="sem2-2022-2023">Học kỳ II (2022 - 2023)</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
      </div>

      {/* View Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface">Loại điểm hiển thị</label>
        <div className="relative">
          <select
            value={filters.viewType}
            onChange={(e) => onChange({ viewType: e.target.value as GradeFiltersState['viewType'] })}
            className="w-full h-11 px-3.5 pr-8 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
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
