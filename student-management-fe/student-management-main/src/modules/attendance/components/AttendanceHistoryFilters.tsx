import React from 'react';
import { AttendanceHistoryFiltersState } from '../types';
import { TeachingClassOption } from '@/modules/teaching/types';
import { Search, RotateCcw, ChevronDown } from 'lucide-react';

interface AttendanceHistoryFiltersProps {
  filters: AttendanceHistoryFiltersState;
  classes: TeachingClassOption[];
  onChange: (filters: Partial<AttendanceHistoryFiltersState>) => void;
  onReset: () => void;
}

const fieldClass =
  'w-full py-2 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl focus:outline-none focus:bg-surface-container-lowest transition-all border border-transparent focus:border-secondary';

export const AttendanceHistoryFilters: React.FC<AttendanceHistoryFiltersProps> = ({
  filters,
  classes,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-3 flex flex-col gap-1.5">
          <label htmlFor="hist-search" className="text-xs font-semibold text-on-surface">Tìm kiếm</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              id="hist-search"
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Tên, Mã HS hoặc tên giáo viên..."
              className={`${fieldClass} pl-9 pr-3`}
            />
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="hist-class" className="text-xs font-semibold text-on-surface">Lớp học</label>
          <div className="relative">
            <select
              id="hist-class"
              value={filters.classId}
              onChange={(e) => onChange({ classId: e.target.value })}
              className={`${fieldClass} pl-3 pr-8 appearance-none cursor-pointer`}
            >
              <option value="">Tất cả lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>Lớp {c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="hist-from" className="text-xs font-semibold text-on-surface">Từ ngày</label>
          <input
            id="hist-from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onChange({ from: e.target.value })}
            className={`${fieldClass} px-3`}
          />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="hist-to" className="text-xs font-semibold text-on-surface">Đến ngày</label>
          <input
            id="hist-to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onChange({ to: e.target.value })}
            className={`${fieldClass} px-3`}
          />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="hist-status" className="text-xs font-semibold text-on-surface">Trạng thái</label>
          <div className="relative">
            <select
              id="hist-status"
              value={filters.status}
              onChange={(e) => onChange({ status: e.target.value })}
              className={`${fieldClass} pl-3 pr-8 appearance-none cursor-pointer`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="present">Có mặt</option>
              <option value="excused">Vắng có phép</option>
              <option value="unexcused">Vắng không phép</option>
              <option value="late">Đi muộn</option>
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
          </div>
        </div>

        <div className="lg:col-span-1 flex items-center">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2 px-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
            title="Đặt lại bộ lọc"
            aria-label="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
